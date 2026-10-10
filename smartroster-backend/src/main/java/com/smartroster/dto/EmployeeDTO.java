package com.smartroster.dto;

import jakarta.validation.constraints.NotBlank;

public class EmployeeDTO {
    private Long id;

    @NotBlank(message = "Employee name is required")
    private String name;

    private Boolean active;
    private Long managerId;
    private String managerName;

    public EmployeeDTO() {}

    public EmployeeDTO(Long id, String name, Boolean active) {
        this.id = id;
        this.name = name;
        this.active = active;
    }

    public EmployeeDTO(Long id, String name, Boolean active, Long managerId, String managerName) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.managerId = managerId;
        this.managerName = managerName;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
}
