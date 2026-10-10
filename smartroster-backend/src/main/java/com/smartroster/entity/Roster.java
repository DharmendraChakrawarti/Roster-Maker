package com.smartroster.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rosters")
public class Roster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, FINALIZED

    @Column(name = "weekly_off_per_employee", nullable = false)
    private Integer weeklyOffPerEmployee = 1; // Weekly offs per week

    @Column(name = "manager_id")
    private Long managerId;

    @Column(name = "manager_name")
    private String managerName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Roster() {}

    public Roster(Integer month, Integer year) {
        this.month = month;
        this.year = year;
        this.status = "DRAFT";
    }

    public Roster(Integer month, Integer year, Long managerId, String managerName) {
        this.month = month;
        this.year = year;
        this.managerId = managerId;
        this.managerName = managerName;
        this.status = "DRAFT";
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
