package com.smartroster.dto;

import java.util.List;

public class UpdateAssignmentsRequest {
    private List<AssignmentUpdate> updates;

    public UpdateAssignmentsRequest() {}

    public List<AssignmentUpdate> getUpdates() { return updates; }
    public void setUpdates(List<AssignmentUpdate> updates) { this.updates = updates; }

    public static class AssignmentUpdate {
        private Long assignmentId;
        private Long employeeId;
        private String assignmentDate;
        private String shiftName;  // null or "OFF" means weekly off
        private Boolean isWeeklyOff;

        public AssignmentUpdate() {}

        public Long getAssignmentId() { return assignmentId; }
        public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }
        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getAssignmentDate() { return assignmentDate; }
        public void setAssignmentDate(String assignmentDate) { this.assignmentDate = assignmentDate; }
        public String getShiftName() { return shiftName; }
        public void setShiftName(String shiftName) { this.shiftName = shiftName; }
        public Boolean getIsWeeklyOff() { return isWeeklyOff; }
        public void setIsWeeklyOff(Boolean isWeeklyOff) { this.isWeeklyOff = isWeeklyOff; }
    }
}
