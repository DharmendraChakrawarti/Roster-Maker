package com.smartroster.dto;

import jakarta.validation.constraints.*;

public class ShiftConfigDTO {
    private Long id;

    @NotBlank(message = "Shift name is required")
    private String shiftName;

    @NotNull(message = "Weekday employee count is required")
    @Min(value = 0, message = "Weekday count must be >= 0")
    private Integer weekdayCount;

    @NotNull(message = "Weekend employee count is required")
    @Min(value = 0, message = "Weekend count must be >= 0")
    private Integer weekendCount;

    private Integer displayOrder;
    private String colorCode;
    private Boolean active;

    public ShiftConfigDTO() {}

    public ShiftConfigDTO(Long id, String shiftName, Integer weekdayCount, Integer weekendCount,
                          Integer displayOrder, String colorCode, Boolean active) {
        this.id = id;
        this.shiftName = shiftName;
        this.weekdayCount = weekdayCount;
        this.weekendCount = weekendCount;
        this.displayOrder = displayOrder;
        this.colorCode = colorCode;
        this.active = active;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }
    public Integer getWeekdayCount() { return weekdayCount; }
    public void setWeekdayCount(Integer weekdayCount) { this.weekdayCount = weekdayCount; }
    public Integer getWeekendCount() { return weekendCount; }
    public void setWeekendCount(Integer weekendCount) { this.weekendCount = weekendCount; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
    public String getColorCode() { return colorCode; }
    public void setColorCode(String colorCode) { this.colorCode = colorCode; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
