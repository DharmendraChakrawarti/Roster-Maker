package com.smartroster.service;

import com.smartroster.dto.ContinuityContextDTO;
import com.smartroster.dto.GenerateRosterRequest;
import com.smartroster.dto.RosterDTO;
import com.smartroster.dto.RosterDTO.RosterAssignmentDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class RosterServiceTest {

    @Autowired
    private RosterService rosterService;

    @Test
    @DisplayName("Verify pre-generation continuity context inspects all previous months")
    void testContinuityContextInspection() {
        ContinuityContextDTO context = rosterService.getContinuityContext(12, 2026);
        assertNotNull(context);
        assertEquals(12, context.getTargetMonth());
        assertEquals(2026, context.getTargetYear());
        assertTrue(context.getActiveEmployeesCount() > 0);
        assertNotNull(context.getStatusMessage());
        assertNotNull(context.getAuditDetails());
        assertFalse(context.getAuditDetails().isEmpty());
    }

    @Test
    @DisplayName("Verify strict 5-day work week and multi-month continuity across November and December")
    void testStrict5DayWorkWeekAndMonthOverMonthContinuity() {
        // 1. Generate November 2026 roster
        GenerateRosterRequest novReq = new GenerateRosterRequest();
        novReq.setMonth(11);
        novReq.setYear(2026);
        novReq.setWeeklyOffPerEmployee(2);

        RosterDTO novRoster = rosterService.generateRoster(novReq);
        assertNotNull(novRoster);
        assertNotNull(novRoster.getAssignments());

        // Verify November work streaks: NO employee works > 5 consecutive days
        verifyNoConsecutiveWorkDaysExceeding5(novRoster.getAssignments(), "November 2026");

        // 2. Inspect Continuity Context for December 2026
        ContinuityContextDTO decContext = rosterService.getContinuityContext(12, 2026);
        assertTrue(decContext.isImmediatePreviousAvailable(), "November should be detected as immediate predecessor for December");
        assertEquals(11, decContext.getImmediatePreviousMonth());
        assertTrue(decContext.getTotalHistoricalMonths() >= 1);

        // 3. Generate December 2026 roster
        GenerateRosterRequest decReq = new GenerateRosterRequest();
        decReq.setMonth(12);
        decReq.setYear(2026);
        decReq.setWeeklyOffPerEmployee(2);

        RosterDTO decRoster = rosterService.generateRoster(decReq);
        assertNotNull(decRoster);
        assertNotNull(decRoster.getAssignments());

        // Verify December internal work streaks: NO employee works > 5 consecutive days
        verifyNoConsecutiveWorkDaysExceeding5(decRoster.getAssignments(), "December 2026");

        // 4. Verify boundary cross-month consecutive work days (Nov 30 into Dec 1..N)
        verifyCrossMonthBoundaryStreaks(novRoster.getAssignments(), decRoster.getAssignments());
    }

    private void verifyNoConsecutiveWorkDaysExceeding5(List<RosterAssignmentDTO> assignments, String label) {
        Map<Long, List<RosterAssignmentDTO>> byEmp = assignments.stream()
                .collect(Collectors.groupingBy(RosterAssignmentDTO::getEmployeeId));

        for (Map.Entry<Long, List<RosterAssignmentDTO>> entry : byEmp.entrySet()) {
            List<RosterAssignmentDTO> list = entry.getValue();
            list.sort(Comparator.comparing(RosterAssignmentDTO::getAssignmentDate));

            int streak = 0;
            for (RosterAssignmentDTO a : list) {
                if (Boolean.TRUE.equals(a.getIsWeeklyOff())) {
                    streak = 0;
                } else {
                    streak++;
                    assertTrue(streak <= 5, String.format("%s: Employee %s exceeded 5 consecutive working days (streak=%d on %s)",
                            label, a.getEmployeeName(), streak, a.getAssignmentDate()));
                }
            }
        }
    }

    private void verifyCrossMonthBoundaryStreaks(List<RosterAssignmentDTO> prevAssignments, List<RosterAssignmentDTO> curAssignments) {
        Map<Long, List<RosterAssignmentDTO>> prevByEmp = prevAssignments.stream()
                .collect(Collectors.groupingBy(RosterAssignmentDTO::getEmployeeId));
        Map<Long, List<RosterAssignmentDTO>> curByEmp = curAssignments.stream()
                .collect(Collectors.groupingBy(RosterAssignmentDTO::getEmployeeId));

        for (Long empId : curByEmp.keySet()) {
            List<RosterAssignmentDTO> prevList = prevByEmp.get(empId);
            if (prevList == null || prevList.isEmpty()) continue;

            prevList.sort(Comparator.comparing(RosterAssignmentDTO::getAssignmentDate));
            int trailingPrev = 0;
            for (int i = prevList.size() - 1; i >= 0; i--) {
                if (Boolean.TRUE.equals(prevList.get(i).getIsWeeklyOff())) break;
                trailingPrev++;
            }

            List<RosterAssignmentDTO> curList = curByEmp.get(empId);
            curList.sort(Comparator.comparing(RosterAssignmentDTO::getAssignmentDate));

            int leadingCur = 0;
            for (RosterAssignmentDTO a : curList) {
                if (Boolean.TRUE.equals(a.getIsWeeklyOff())) break;
                leadingCur++;
            }

            int boundaryStreak = trailingPrev + leadingCur;
            assertTrue(boundaryStreak <= 5, String.format("Cross-Month Boundary Violation for Employee %s: trailing=%d, leading=%d, total=%d (exceeds 5)",
                    curList.get(0).getEmployeeName(), trailingPrev, leadingCur, boundaryStreak));
        }
    }
}
