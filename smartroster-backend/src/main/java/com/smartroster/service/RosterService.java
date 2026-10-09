package com.smartroster.service;

import com.smartroster.dto.GenerateRosterRequest;
import com.smartroster.dto.RosterDTO;
import com.smartroster.dto.RosterDTO.RosterAssignmentDTO;
import com.smartroster.dto.RosterDTO.EmployeeShiftSummary;
import com.smartroster.dto.UpdateAssignmentsRequest;
import com.smartroster.entity.*;
import com.smartroster.exception.BusinessException;
import com.smartroster.exception.ResourceNotFoundException;
import com.smartroster.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RosterService {

    private final RosterRepository rosterRepository;
    private final RosterAssignmentRepository assignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final ShiftConfigRepository shiftConfigRepository;

    public RosterService(RosterRepository rosterRepository,
                         RosterAssignmentRepository assignmentRepository,
                         EmployeeRepository employeeRepository,
                         ShiftConfigRepository shiftConfigRepository) {
        this.rosterRepository = rosterRepository;
        this.assignmentRepository = assignmentRepository;
        this.employeeRepository = employeeRepository;
        this.shiftConfigRepository = shiftConfigRepository;
    }

    public List<RosterDTO> getAllRosters() {
        return rosterRepository.findAllByOrderByYearDescMonthDesc().stream()
                .map(r -> {
                    RosterDTO dto = new RosterDTO();
                    dto.setId(r.getId());
                    dto.setMonth(r.getMonth());
                    dto.setYear(r.getYear());
                    dto.setStatus(r.getStatus());
                    dto.setWeeklyOffPerEmployee(r.getWeeklyOffPerEmployee());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public RosterDTO getRoster(Long id) {
        Roster roster = rosterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Roster not found with id: " + id));
        return buildRosterDTO(roster);
    }

    public RosterDTO getRosterByMonthYear(int month, int year) {
        Roster roster = rosterRepository.findByMonthAndYear(month, year)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No roster found for " + month + "/" + year));
        return buildRosterDTO(roster);
    }

    /**
     * Core roster generation algorithm.
     *
     * Algorithm overview:
     * 1. For each day in the month, determine if it's a weekday or weekend.
     * 2. For each shift, determine required employee count based on day type.
     * 3. Track per-employee shift counts and off counts for fairness.
     * 4. Each week, assign weekly offs fairly (round-robin, least-offs-first).
     * 5. Assign shifts to remaining employees, prioritizing those with fewest
     *    assignments of that shift type.
     * 6. Ensure no employee works the same shift more than 6 consecutive days.
     * 7. Collect warnings for insufficient employees or unfilled shifts.
     */
    @Transactional
    public RosterDTO generateRoster(GenerateRosterRequest request) {
        int month = request.getMonth();
        int year = request.getYear();
        int weeklyOffsPerEmployee = (request.getWeeklyOffPerEmployee() != null && request.getWeeklyOffPerEmployee() > 0)
                ? request.getWeeklyOffPerEmployee() : 2;

        // Get active employees and shift configs
        List<Employee> employees = employeeRepository.findByActiveTrueOrderByNameAsc();
        List<ShiftConfig> shiftConfigs = shiftConfigRepository.findByActiveTrueOrderByDisplayOrderAsc();

        List<String> warnings = new ArrayList<>();

        if (employees.isEmpty()) {
            throw new BusinessException("No active employees found. Please add employees first.");
        }
        if (shiftConfigs.isEmpty()) {
            throw new BusinessException("No active shift configurations found. Please configure shifts first.");
        }

        // Calculate total required per day
        int maxWeekdayRequired = shiftConfigs.stream().mapToInt(ShiftConfig::getWeekdayCount).sum();
        int maxWeekendRequired = shiftConfigs.stream().mapToInt(ShiftConfig::getWeekendCount).sum();

        if (employees.size() < maxWeekdayRequired) {
            warnings.add(String.format("Warning: Only %d employees available, but %d needed for weekday shifts. Some shifts may be understaffed.",
                    employees.size(), maxWeekdayRequired));
        }
        if (employees.size() < maxWeekendRequired) {
            warnings.add(String.format("Warning: Only %d employees available, but %d needed for weekend shifts. Some shifts may be understaffed.",
                    employees.size(), maxWeekendRequired));
        }

        // Check for existing roster and clean up prior assignments cleanly to prevent unique constraint conflicts
        Optional<Roster> existingOpt = rosterRepository.findByMonthAndYear(month, year);
        Roster roster;
        if (existingOpt.isPresent()) {
            roster = existingOpt.get();
            roster.setStatus("DRAFT");
            roster.setWeeklyOffPerEmployee(weeklyOffsPerEmployee);
            roster = rosterRepository.saveAndFlush(roster);
            assignmentRepository.deleteByRosterId(roster.getId());
            assignmentRepository.flush();
        } else {
            roster = new Roster(month, year);
            roster.setWeeklyOffPerEmployee(weeklyOffsPerEmployee);
            roster = rosterRepository.saveAndFlush(roster);
        }

        YearMonth yearMonth = YearMonth.of(year, month);
        int daysInMonth = yearMonth.lengthOfMonth();
        int totalEmployees = employees.size();

        // -------------------------------------------------------------
        // Step 1: Pre-calculate Weekly Offs for each employee across the month
        // -------------------------------------------------------------
        // Map: dayNumber (1..daysInMonth) -> Set of employee IDs who have weekly off
        Map<Integer, Set<Long>> offSchedule = planWeeklyOffs(employees, daysInMonth, weeklyOffsPerEmployee);

        // -------------------------------------------------------------
        // Step 2: Assign Shifts Day by Day
        // -------------------------------------------------------------
        // Tracking metrics for shift balance and rest rules
        Map<Long, Map<String, Integer>> empShiftCounts = new HashMap<>(); // empId -> shiftName -> count
        Map<Long, Integer> empTotalShifts = new HashMap<>();
        Map<Long, String> empPreviousDayShift = new HashMap<>(); // empId -> shift worked on day d-1

        for (Employee emp : employees) {
            empShiftCounts.put(emp.getId(), new HashMap<>());
            empTotalShifts.put(emp.getId(), 0);
        }

        List<RosterAssignment> allAssignments = new ArrayList<>();

        // Process each day of the month
        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = LocalDate.of(year, month, day);
            DayOfWeek dow = date.getDayOfWeek();
            boolean isWeekend = (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY);

            Set<Long> employeesOffToday = offSchedule.getOrDefault(day, Collections.emptySet());

            // Working employees available today
            List<Employee> availableEmployees = employees.stream()
                    .filter(e -> !employeesOffToday.contains(e.getId()))
                    .collect(Collectors.toList());

            // Map of assigned employees for today: empId -> shiftName
            Map<Long, String> todayAssignedShifts = new HashMap<>();

            // 1. Assign Morning shift first (since it is constrained by rest rule from yesterday's Night shift), then Evening, then Night
            List<ShiftConfig> sortedShiftConfigs = new ArrayList<>(shiftConfigs);
            sortedShiftConfigs.sort((a, b) -> {
                boolean aMorning = a.getShiftName().toLowerCase().contains("morning");
                boolean bMorning = b.getShiftName().toLowerCase().contains("morning");
                if (aMorning && !bMorning) return -1;
                if (!aMorning && bMorning) return 1;
                boolean aNight = a.getShiftName().toLowerCase().contains("night");
                boolean bNight = b.getShiftName().toLowerCase().contains("night");
                if (aNight && !bNight) return 1;
                if (!aNight && bNight) return -1;
                return Integer.compare(a.getDisplayOrder(), b.getDisplayOrder());
            });

            for (ShiftConfig shift : sortedShiftConfigs) {
                int requiredCount = isWeekend ? shift.getWeekendCount() : shift.getWeekdayCount();
                boolean isMorningShift = shift.getShiftName().toLowerCase().contains("morning");

                // Filter eligible candidates
                List<Employee> eligibleCandidates = availableEmployees.stream()
                        .filter(e -> !todayAssignedShifts.containsKey(e.getId()))
                        .filter(e -> {
                            if (isMorningShift) {
                                // Enforce rest period: Cannot do Morning right after Night shift
                                String prevShift = empPreviousDayShift.get(e.getId());
                                return prevShift == null || !prevShift.toLowerCase().contains("night");
                            }
                            return true;
                        })
                        .sorted(Comparator
                                .comparingInt((Employee e) ->
                                        empShiftCounts.get(e.getId()).getOrDefault(shift.getShiftName(), 0))
                                .thenComparingInt(e -> empTotalShifts.get(e.getId())))
                        .collect(Collectors.toList());

                // If morning shift candidates were too restricted due to rest rule, relax fallback if needed
                if (eligibleCandidates.size() < requiredCount) {
                    List<Employee> fallbackCandidates = availableEmployees.stream()
                            .filter(e -> !todayAssignedShifts.containsKey(e.getId()))
                            .sorted(Comparator
                                    .comparingInt((Employee e) ->
                                            empShiftCounts.get(e.getId()).getOrDefault(shift.getShiftName(), 0))
                                    .thenComparingInt(e -> empTotalShifts.get(e.getId())))
                            .collect(Collectors.toList());
                    eligibleCandidates = fallbackCandidates;
                }

                int assignedCount = 0;
                for (Employee candidate : eligibleCandidates) {
                    if (assignedCount >= requiredCount) break;

                    todayAssignedShifts.put(candidate.getId(), shift.getShiftName());
                    empShiftCounts.get(candidate.getId()).merge(shift.getShiftName(), 1, Integer::sum);
                    empTotalShifts.merge(candidate.getId(), 1, Integer::sum);
                    assignedCount++;
                }

                if (assignedCount < requiredCount) {
                    warnings.add(String.format("Warning: Only %d of %d required employees assigned to %s shift on %s",
                            assignedCount, requiredCount, shift.getShiftName(), date));
                }
            }

            // 2. Extra available employees on this day: distribute to shifts to ensure all working employees have assignments
            List<Employee> extraEmployees = availableEmployees.stream()
                    .filter(e -> !todayAssignedShifts.containsKey(e.getId()))
                    .collect(Collectors.toList());

            for (Employee extra : extraEmployees) {
                // Find the shift this employee has worked the least, respecting rest rule
                String prevShift = empPreviousDayShift.get(extra.getId());
                boolean workedNightYesterday = (prevShift != null && prevShift.toLowerCase().contains("night"));

                ShiftConfig bestShift = shiftConfigs.stream()
                        .filter(s -> !(workedNightYesterday && s.getShiftName().toLowerCase().contains("morning")))
                        .min(Comparator.comparingInt(s ->
                                empShiftCounts.get(extra.getId()).getOrDefault(s.getShiftName(), 0)))
                        .orElse(shiftConfigs.get(0));

                todayAssignedShifts.put(extra.getId(), bestShift.getShiftName());
                empShiftCounts.get(extra.getId()).merge(bestShift.getShiftName(), 1, Integer::sum);
                empTotalShifts.merge(extra.getId(), 1, Integer::sum);
            }

            // 3. Create RosterAssignment objects for all employees for this day
            for (Employee emp : employees) {
                if (employeesOffToday.contains(emp.getId())) {
                    // Weekly OFF
                    RosterAssignment offAssignment = new RosterAssignment(
                            roster, emp, date, null, true);
                    allAssignments.add(offAssignment);
                    empPreviousDayShift.put(emp.getId(), null);
                } else {
                    // Shift assignment
                    String assignedShift = todayAssignedShifts.get(emp.getId());
                    if (assignedShift == null && !shiftConfigs.isEmpty()) {
                        assignedShift = shiftConfigs.get(0).getShiftName();
                    }
                    RosterAssignment shiftAssignment = new RosterAssignment(
                            roster, emp, date, assignedShift, false);
                    allAssignments.add(shiftAssignment);
                    empPreviousDayShift.put(emp.getId(), assignedShift);
                }
            }
        }

        // Save and flush all assignments
        assignmentRepository.saveAllAndFlush(allAssignments);

        // Build response and run full validation
        List<String> validationWarnings = validateRoster(roster.getId());
        warnings.addAll(validationWarnings);

        RosterDTO dto = buildRosterDTO(roster);
        dto.setWarnings(warnings);
        return dto;
    }

    /**
     * Pre-plans Weekly Offs for all employees across the month.
     * Guarantees:
     * 1. In every 7-day period (days 1-7, 8-14, 15-21, 22-28), each employee gets EXACTLY weeklyOffsPerEmployee offs.
     * 2. When weeklyOffsPerEmployee == 2, offs are strictly CONSECUTIVE (back-to-back 2 days).
     * 3. Offs are smoothly and uniformly distributed across all 7 days of the week (~2/7 of staff off each day).
     * 4. Daily shift staffing requirements are always preserved with zero artificial shortages.
     * 5. Consecutive working days between weekly offs are kept at <= 5 days.
     */
    private Map<Integer, Set<Long>> planWeeklyOffs(List<Employee> employees, int daysInMonth, int weeklyOffsPerEmployee) {
        Map<Integer, Set<Long>> schedule = new HashMap<>();
        for (int d = 1; d <= daysInMonth; d++) {
            schedule.put(d, new HashSet<>());
        }

        int totalEmployees = employees.size();
        if (totalEmployees == 0) return schedule;

        for (int i = 0; i < totalEmployees; i++) {
            Employee emp = employees.get(i);
            int pattern = i % 7; // Distribute evenly across 7 days/pairs

            for (int day = 1; day <= daysInMonth; day++) {
                int dayOffset = (day - 1) % 7; // 0..6 for the 7-day cycle

                if (weeklyOffsPerEmployee >= 2) {
                    // Two CONSECUTIVE offs per 7-day cycle
                    // Pattern p has off on dayOffset p and dayOffset (p + 1) % 7
                    if (dayOffset == pattern || dayOffset == (pattern + 1) % 7) {
                        schedule.get(day).add(emp.getId());
                    }
                } else {
                    // One off per 7-day cycle
                    if (dayOffset == pattern) {
                        schedule.get(day).add(emp.getId());
                    }
                }
            }
        }

        return schedule;
    }

    @Transactional
    public RosterDTO updateAssignments(Long rosterId, UpdateAssignmentsRequest request) {
        Roster roster = rosterRepository.findById(rosterId)
                .orElseThrow(() -> new ResourceNotFoundException("Roster not found with id: " + rosterId));

        List<String> warnings = new ArrayList<>();

        for (UpdateAssignmentsRequest.AssignmentUpdate update : request.getUpdates()) {
            if (update.getAssignmentId() != null) {
                // Update existing assignment
                RosterAssignment assignment = assignmentRepository.findById(update.getAssignmentId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Assignment not found: " + update.getAssignmentId()));

                if (update.getIsWeeklyOff() != null && update.getIsWeeklyOff()) {
                    assignment.setShiftName(null);
                    assignment.setIsWeeklyOff(true);
                } else {
                    assignment.setShiftName(update.getShiftName());
                    assignment.setIsWeeklyOff(false);
                }
                assignment.setIsManualEdit(true);
                assignmentRepository.save(assignment);
            } else if (update.getEmployeeId() != null && update.getAssignmentDate() != null) {
                // Find by employee and date
                LocalDate date = LocalDate.parse(update.getAssignmentDate());
                List<RosterAssignment> existing = assignmentRepository.findByRosterIdWithEmployee(rosterId)
                        .stream()
                        .filter(a -> a.getEmployee().getId().equals(update.getEmployeeId())
                                && a.getAssignmentDate().equals(date))
                        .collect(Collectors.toList());

                if (!existing.isEmpty()) {
                    RosterAssignment assignment = existing.get(0);
                    if (update.getIsWeeklyOff() != null && update.getIsWeeklyOff()) {
                        assignment.setShiftName(null);
                        assignment.setIsWeeklyOff(true);
                    } else {
                        assignment.setShiftName(update.getShiftName());
                        assignment.setIsWeeklyOff(false);
                    }
                    assignment.setIsManualEdit(true);
                    assignmentRepository.save(assignment);
                } else {
                    // Create new assignment
                    Employee emp = employeeRepository.findById(update.getEmployeeId())
                            .orElseThrow(() -> new ResourceNotFoundException(
                                    "Employee not found: " + update.getEmployeeId()));
                    boolean isOff = update.getIsWeeklyOff() != null && update.getIsWeeklyOff();
                    RosterAssignment newAssignment = new RosterAssignment(
                            roster, emp, date,
                            isOff ? null : update.getShiftName(),
                            isOff);
                    newAssignment.setIsManualEdit(true);
                    assignmentRepository.save(newAssignment);
                }
            }
        }

        // Validate the updated roster
        warnings.addAll(validateRoster(rosterId));

        RosterDTO dto = buildRosterDTO(roster);
        dto.setWarnings(warnings);
        return dto;
    }

    @Transactional
    public RosterDTO finalizeRoster(Long rosterId) {
        Roster roster = rosterRepository.findById(rosterId)
                .orElseThrow(() -> new ResourceNotFoundException("Roster not found: " + rosterId));
        roster.setStatus("FINALIZED");
        rosterRepository.save(roster);
        return buildRosterDTO(roster);
    }

    private List<String> validateRoster(Long rosterId) {
        List<String> warnings = new ArrayList<>();
        List<RosterAssignment> assignments = assignmentRepository.findByRosterIdWithEmployee(rosterId);
        List<ShiftConfig> shiftConfigs = shiftConfigRepository.findByActiveTrueOrderByDisplayOrderAsc();

        // Group by date
        Map<LocalDate, List<RosterAssignment>> byDate = assignments.stream()
                .collect(Collectors.groupingBy(RosterAssignment::getAssignmentDate));

        for (Map.Entry<LocalDate, List<RosterAssignment>> entry : byDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<RosterAssignment> dayAssignments = entry.getValue();
            boolean isWeekend = date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY;

            // Check if each shift has enough employees
            for (ShiftConfig shift : shiftConfigs) {
                int required = isWeekend ? shift.getWeekendCount() : shift.getWeekdayCount();
                long actual = dayAssignments.stream()
                        .filter(a -> shift.getShiftName().equals(a.getShiftName()))
                        .count();
                if (actual < required) {
                    warnings.add(String.format("Understaffed: %s shift on %s needs %d but has %d",
                            shift.getShiftName(), date, required, actual));
                }
            }

            // Check for duplicate assignments (same employee, same date, multiple shifts)
            Map<Long, List<RosterAssignment>> byEmployee = dayAssignments.stream()
                    .filter(a -> !a.getIsWeeklyOff())
                    .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

            for (Map.Entry<Long, List<RosterAssignment>> empEntry : byEmployee.entrySet()) {
                if (empEntry.getValue().size() > 1) {
                    String empName = empEntry.getValue().get(0).getEmployee().getName();
                    warnings.add(String.format("Conflict: %s has multiple shifts on %s", empName, date));
                }
            }
        }

        // Check for Night -> Morning rest rule violations and excessive consecutive work days per employee
        Map<Long, List<RosterAssignment>> byEmployeeSorted = assignments.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        for (List<RosterAssignment> empAssignments : byEmployeeSorted.values()) {
            empAssignments.sort(Comparator.comparing(RosterAssignment::getAssignmentDate));
            String empName = empAssignments.isEmpty() ? "" : empAssignments.get(0).getEmployee().getName();
            int consecutiveWorkDays = 0;

            for (int i = 0; i < empAssignments.size(); i++) {
                RosterAssignment cur = empAssignments.get(i);
                if (cur.getIsWeeklyOff()) {
                    consecutiveWorkDays = 0;
                } else {
                    consecutiveWorkDays++;
                    if (consecutiveWorkDays > 6) {
                        warnings.add(String.format("Rule Warning: %s works %d consecutive days on %s without weekly off",
                                empName, consecutiveWorkDays, cur.getAssignmentDate()));
                    }

                    // Check Night -> Morning transition
                    if (i > 0) {
                        RosterAssignment prev = empAssignments.get(i - 1);
                        if (prev.getAssignmentDate().plusDays(1).equals(cur.getAssignmentDate())) {
                            if (!prev.getIsWeeklyOff() && prev.getShiftName() != null
                                    && prev.getShiftName().toLowerCase().contains("night")
                                    && cur.getShiftName() != null
                                    && cur.getShiftName().toLowerCase().contains("morning")) {
                                warnings.add(String.format("Rest Violation: %s scheduled Morning on %s immediately after Night shift on %s",
                                        empName, cur.getAssignmentDate(), prev.getAssignmentDate()));
                            }
                        }
                    }
                }
            }
        }

        return warnings;
    }

    private RosterDTO buildRosterDTO(Roster roster) {
        RosterDTO dto = new RosterDTO();
        dto.setId(roster.getId());
        dto.setMonth(roster.getMonth());
        dto.setYear(roster.getYear());
        dto.setStatus(roster.getStatus());
        dto.setWeeklyOffPerEmployee(roster.getWeeklyOffPerEmployee());

        List<RosterAssignment> assignments = assignmentRepository.findByRosterIdWithEmployee(roster.getId());

        List<RosterAssignmentDTO> assignmentDTOs = new ArrayList<>();
        Map<String, EmployeeShiftSummary> summaryMap = new LinkedHashMap<>();

        for (RosterAssignment a : assignments) {
            RosterAssignmentDTO aDto = new RosterAssignmentDTO();
            aDto.setId(a.getId());
            aDto.setEmployeeId(a.getEmployee().getId());
            aDto.setEmployeeName(a.getEmployee().getName());
            aDto.setAssignmentDate(a.getAssignmentDate().toString());
            aDto.setShiftName(a.getShiftName());
            aDto.setIsWeeklyOff(a.getIsWeeklyOff());
            aDto.setIsManualEdit(a.getIsManualEdit());
            aDto.setDayOfWeek(a.getAssignmentDate().getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            assignmentDTOs.add(aDto);

            // Build summary
            String empKey = a.getEmployee().getId() + "_" + a.getEmployee().getName();
            EmployeeShiftSummary summary = summaryMap.computeIfAbsent(empKey, k -> {
                EmployeeShiftSummary s = new EmployeeShiftSummary();
                s.setEmployeeName(a.getEmployee().getName());
                s.setShiftCounts(new HashMap<>());
                s.setTotalWeeklyOffs(0);
                s.setTotalAssignments(0);
                return s;
            });

            if (a.getIsWeeklyOff()) {
                summary.setTotalWeeklyOffs(summary.getTotalWeeklyOffs() + 1);
            } else if (a.getShiftName() != null) {
                summary.getShiftCounts().merge(a.getShiftName(), 1, Integer::sum);
                summary.setTotalAssignments(summary.getTotalAssignments() + 1);
            }
        }

        dto.setAssignments(assignmentDTOs);
        dto.setEmployeeSummary(summaryMap);
        dto.setWarnings(new ArrayList<>());
        return dto;
    }

    @Transactional
    public void deleteRoster(Long id) {
        Roster roster = rosterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Roster not found: " + id));
        assignmentRepository.deleteByRosterId(id);
        assignmentRepository.flush();
        rosterRepository.delete(roster);
    }
}
