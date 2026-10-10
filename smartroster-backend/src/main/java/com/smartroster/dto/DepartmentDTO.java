package com.smartroster.dto;

import com.smartroster.entity.Department;
import java.time.LocalDateTime;

public class DepartmentDTO {

    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private long userCount;

    public DepartmentDTO() {}

    public DepartmentDTO(Long id, String name, String description, LocalDateTime createdAt, long userCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.userCount = userCount;
    }

    public static DepartmentDTO fromEntity(Department dept, long userCount) {
        return new DepartmentDTO(
                dept.getId(),
                dept.getName(),
                dept.getDescription(),
                dept.getCreatedAt(),
                userCount
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public long getUserCount() {
        return userCount;
    }

    public void setUserCount(long userCount) {
        this.userCount = userCount;
    }
}
