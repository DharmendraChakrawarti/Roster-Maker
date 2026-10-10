package com.smartroster.dto;

import com.smartroster.entity.User;

public class ManagerSummaryDTO {
    private Long id;
    private String fullName;
    private String username;
    private String department;

    public ManagerSummaryDTO() {}

    public ManagerSummaryDTO(Long id, String fullName, String username, String department) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.department = department;
    }

    public static ManagerSummaryDTO fromUser(User user) {
        return new ManagerSummaryDTO(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getDepartment()
        );
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}
