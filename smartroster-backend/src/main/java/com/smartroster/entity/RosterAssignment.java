package com.smartroster.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "roster_assignments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"roster_id", "employee_id", "assignment_date"})
})
public class RosterAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roster_id", nullable = false)
    private Roster roster;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "assignment_date", nullable = false)
    private LocalDate assignmentDate;

    @Column(name = "shift_name")
    private String shiftName; // null means OFF

    @Column(name = "is_weekly_off", nullable = false)
    private Boolean isWeeklyOff = false;

    @Column(name = "is_manual_edit", nullable = false)
    private Boolean isManualEdit = false;

    public RosterAssignment() {}

    public RosterAssignment(Roster roster, Employee employee, LocalDate assignmentDate, String shiftName, boolean isWeeklyOff) {
        this.roster = roster;
        this.employee = employee;
        this.assignmentDate = assignmentDate;
        this.shiftName = shiftName;
        this.isWeeklyOff = isWeeklyOff;
        this.isManualEdit = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Roster getRoster() { return roster; }
    public void setRoster(Roster roster) { this.roster = roster; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public LocalDate getAssignmentDate() { return assignmentDate; }
    public void setAssignmentDate(LocalDate assignmentDate) { this.assignmentDate = assignmentDate; }

    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }

    public Boolean getIsWeeklyOff() { return isWeeklyOff; }
    public void setIsWeeklyOff(Boolean isWeeklyOff) { this.isWeeklyOff = isWeeklyOff; }

    public Boolean getIsManualEdit() { return isManualEdit; }
    public void setIsManualEdit(Boolean isManualEdit) { this.isManualEdit = isManualEdit; }
}
