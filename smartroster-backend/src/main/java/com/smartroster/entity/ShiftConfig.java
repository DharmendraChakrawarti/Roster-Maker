package com.smartroster.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_configs")
public class ShiftConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shift_name", nullable = false)
    private String shiftName;

    @Column(name = "weekday_count", nullable = false)
    private Integer weekdayCount;

    @Column(name = "weekend_count", nullable = false)
    private Integer weekendCount;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "color_code")
    private String colorCode = "#4CAF50";

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ShiftConfig() {}

    public ShiftConfig(String shiftName, Integer weekdayCount, Integer weekendCount, String colorCode) {
        this.shiftName = shiftName;
        this.weekdayCount = weekdayCount;
        this.weekendCount = weekendCount;
        this.colorCode = colorCode;
        this.active = true;
    }

    public ShiftConfig(String shiftName, Integer weekdayCount, Integer weekendCount, String colorCode, Long managerId) {
        this.shiftName = shiftName;
        this.weekdayCount = weekdayCount;
        this.weekendCount = weekendCount;
        this.colorCode = colorCode;
        this.active = true;
        this.managerId = managerId;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
