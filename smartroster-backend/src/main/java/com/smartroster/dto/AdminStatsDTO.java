package com.smartroster.dto;

public class AdminStatsDTO {
    private long totalUsers;
    private long activeUsers;
    private long adminCount;
    private long managerCount;
    private long userCount;
    private long activeEmployeesCount;

    public AdminStatsDTO() {}

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public long getAdminCount() { return adminCount; }
    public void setAdminCount(long adminCount) { this.adminCount = adminCount; }

    public long getManagerCount() { return managerCount; }
    public void setManagerCount(long managerCount) { this.managerCount = managerCount; }

    public long getUserCount() { return userCount; }
    public void setUserCount(long userCount) { this.userCount = userCount; }

    public long getActiveEmployeesCount() { return activeEmployeesCount; }
    public void setActiveEmployeesCount(long activeEmployeesCount) { this.activeEmployeesCount = activeEmployeesCount; }
}
