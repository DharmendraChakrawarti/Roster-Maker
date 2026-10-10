package com.smartroster.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class RosterDTO {
    private Long id;
    private Integer month;
    private Integer year;
    private String status;
    private Integer weeklyOffPerEmployee;
    private Long managerId;
    private String managerName;
    private List<RosterAssignmentDTO> assignments;
    private List<String> warnings;
    private Map<String, EmployeeShiftSummary> employeeSummary;

    public RosterDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getWeeklyOffPerEmployee() { return weeklyOffPerEmployee; }
    public void setWeeklyOffPerEmployee(Integer weeklyOffPerEmployee) { this.weeklyOffPerEmployee = weeklyOffPerEmployee; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public List<RosterAssignmentDTO> getAssignments() { return assignments; }
    public void setAssignments(List<RosterAssignmentDTO> assignments) { this.assignments = assignments; }
    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }
    public Map<String, EmployeeShiftSummary> getEmployeeSummary() { return employeeSummary; }
    public void setEmployeeSummary(Map<String, EmployeeShiftSummary> employeeSummary) { this.employeeSummary = employeeSummary; }

    public static class RosterAssignmentDTO {
        private Long id;
        private Long employeeId;
        private String employeeName;
        private String assignmentDate;
        private String shiftName;
        private Boolean isWeeklyOff;
        private Boolean isManualEdit;
        private String dayOfWeek;

        public RosterAssignmentDTO() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public String getAssignmentDate() { return assignmentDate; }
        public void setAssignmentDate(String assignmentDate) { this.assignmentDate = assignmentDate; }
        public String getShiftName() { return shiftName; }
        public void setShiftName(String shiftName) { this.shiftName = shiftName; }
        public Boolean getIsWeeklyOff() { return isWeeklyOff; }
        public void setIsWeeklyOff(Boolean isWeeklyOff) { this.isWeeklyOff = isWeeklyOff; }
        public Boolean getIsManualEdit() { return isManualEdit; }
        public void setIsManualEdit(Boolean isManualEdit) { this.isManualEdit = isManualEdit; }
        public String getDayOfWeek() { return dayOfWeek; }
        public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    }

    public static class EmployeeShiftSummary {
        private String employeeName;
        private Map<String, Integer> shiftCounts;
        private Integer totalWeeklyOffs;
        private Integer totalAssignments;

        public EmployeeShiftSummary() {}

        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public Map<String, Integer> getShiftCounts() { return shiftCounts; }
        public void setShiftCounts(Map<String, Integer> shiftCounts) { this.shiftCounts = shiftCounts; }
        public Integer getTotalWeeklyOffs() { return totalWeeklyOffs; }
        public void setTotalWeeklyOffs(Integer totalWeeklyOffs) { this.totalWeeklyOffs = totalWeeklyOffs; }
        public Integer getTotalAssignments() { return totalAssignments; }
        public void setTotalAssignments(Integer totalAssignments) { this.totalAssignments = totalAssignments; }
    }
}
