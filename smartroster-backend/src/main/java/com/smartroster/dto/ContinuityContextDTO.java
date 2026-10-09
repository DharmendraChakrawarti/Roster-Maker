package com.smartroster.dto;

import java.util.ArrayList;
import java.util.List;

public class ContinuityContextDTO {
    private int targetMonth;
    private int targetYear;
    private String targetMonthName;
    private boolean immediatePreviousAvailable;
    private Integer immediatePreviousMonth;
    private Integer immediatePreviousYear;
    private String immediatePreviousMonthName;
    private int totalHistoricalMonths;
    private List<HistoricalMonthSummary> historicalMonths = new ArrayList<>();
    private int activeEmployeesCount;
    private String statusMessage;
    private boolean readyToGenerate;
    private List<String> auditDetails = new ArrayList<>();

    public static class HistoricalMonthSummary {
        private int month;
        private int year;
        private String monthName;
        private String status;
        private int assignmentCount;

        public HistoricalMonthSummary() {}

        public HistoricalMonthSummary(int month, int year, String monthName, String status, int assignmentCount) {
            this.month = month;
            this.year = year;
            this.monthName = monthName;
            this.status = status;
            this.assignmentCount = assignmentCount;
        }

        public int getMonth() { return month; }
        public void setMonth(int month) { this.month = month; }

        public int getYear() { return year; }
        public void setYear(int year) { this.year = year; }

        public String getMonthName() { return monthName; }
        public void setMonthName(String monthName) { this.monthName = monthName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public int getAssignmentCount() { return assignmentCount; }
        public void setAssignmentCount(int assignmentCount) { this.assignmentCount = assignmentCount; }
    }

    public ContinuityContextDTO() {}

    public int getTargetMonth() { return targetMonth; }
    public void setTargetMonth(int targetMonth) { this.targetMonth = targetMonth; }

    public int getTargetYear() { return targetYear; }
    public void setTargetYear(int targetYear) { this.targetYear = targetYear; }

    public String getTargetMonthName() { return targetMonthName; }
    public void setTargetMonthName(String targetMonthName) { this.targetMonthName = targetMonthName; }

    public boolean isImmediatePreviousAvailable() { return immediatePreviousAvailable; }
    public void setImmediatePreviousAvailable(boolean immediatePreviousAvailable) { this.immediatePreviousAvailable = immediatePreviousAvailable; }

    public Integer getImmediatePreviousMonth() { return immediatePreviousMonth; }
    public void setImmediatePreviousMonth(Integer immediatePreviousMonth) { this.immediatePreviousMonth = immediatePreviousMonth; }

    public Integer getImmediatePreviousYear() { return immediatePreviousYear; }
    public void setImmediatePreviousYear(Integer immediatePreviousYear) { this.immediatePreviousYear = immediatePreviousYear; }

    public String getImmediatePreviousMonthName() { return immediatePreviousMonthName; }
    public void setImmediatePreviousMonthName(String immediatePreviousMonthName) { this.immediatePreviousMonthName = immediatePreviousMonthName; }

    public int getTotalHistoricalMonths() { return totalHistoricalMonths; }
    public void setTotalHistoricalMonths(int totalHistoricalMonths) { this.totalHistoricalMonths = totalHistoricalMonths; }

    public List<HistoricalMonthSummary> getHistoricalMonths() { return historicalMonths; }
    public void setHistoricalMonths(List<HistoricalMonthSummary> historicalMonths) { this.historicalMonths = historicalMonths; }

    public int getActiveEmployeesCount() { return activeEmployeesCount; }
    public void setActiveEmployeesCount(int activeEmployeesCount) { this.activeEmployeesCount = activeEmployeesCount; }

    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }

    public boolean isReadyToGenerate() { return readyToGenerate; }
    public void setReadyToGenerate(boolean readyToGenerate) { this.readyToGenerate = readyToGenerate; }

    public List<String> getAuditDetails() { return auditDetails; }
    public void setAuditDetails(List<String> auditDetails) { this.auditDetails = auditDetails; }
}
