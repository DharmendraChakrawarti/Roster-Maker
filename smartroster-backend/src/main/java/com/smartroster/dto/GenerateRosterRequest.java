package com.smartroster.dto;

import jakarta.validation.constraints.*;

public class GenerateRosterRequest {

    @NotNull(message = "Month is required")
    @Min(value = 1, message = "Month must be between 1 and 12")
    @Max(value = 12, message = "Month must be between 1 and 12")
    private Integer month;

    @NotNull(message = "Year is required")
    @Min(value = 2000, message = "Year must be >= 2000")
    @Max(value = 2100, message = "Year must be <= 2100")
    private Integer year;

    @Min(value = 1, message = "Weekly offs must be >= 1")
    @Max(value = 3, message = "Weekly offs must be <= 3")
    private Integer weeklyOffPerEmployee = 1;

    public GenerateRosterRequest() {}

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getWeeklyOffPerEmployee() { return weeklyOffPerEmployee; }
    public void setWeeklyOffPerEmployee(Integer weeklyOffPerEmployee) { this.weeklyOffPerEmployee = weeklyOffPerEmployee; }
}
