import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RosterService } from '../../services/roster.service';
import { ShiftConfigService } from '../../services/shift-config.service';
import { EmployeeService } from '../../services/employee.service';
import { AuthService } from '../../services/auth.service';
import { ManagerSummary } from '../../models/auth.models';
import {
  Roster,
  RosterAssignment,
  ShiftConfig,
  Employee,
  GenerateRosterRequest,
  AssignmentUpdate,
  ContinuityContext
} from '../../models/models';

interface DayColumn {
  dayNumber: number;
  dateStr: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isSunday: boolean;
  isSaturday: boolean;
}

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>{{ isStaff ? 'My Shift Schedule' : 'Shift Roster Management' }}</h1>
          <p class="text-secondary subtitle">
            {{ isStaff ? 'View and export shift schedules published by your operations manager' : 'Generate, customize, and analyze monthly shift rosters with automated fairness rules' }}
          </p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" (click)="loadAllRosters()" title="Refresh Roster Data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Refresh
          </button>
          <button *ngIf="currentRoster && currentRoster.id" class="btn btn-success" (click)="exportExcel()" [disabled]="loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Excel
          </button>
          <button *ngIf="canEdit && currentRoster && currentRoster.id && currentRoster.status !== 'FINALIZED'" class="btn btn-accent" (click)="finalizeCurrentRoster()" [disabled]="loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Finalize Roster
          </button>
          <button *ngIf="canEdit && currentRoster && currentRoster.id" class="btn btn-danger" (click)="deleteCurrentRoster()" [disabled]="loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Delete
          </button>
        </div>
      </div>

      <!-- Manager Scope & Ownership Context Banner -->
      <div class="card mb-3 manager-scope-banner">
        <div class="manager-scope-content">
          <div class="manager-scope-icon" [class.staff-icon]="isStaff" [class.manager-icon]="isManager" [class.admin-icon]="isAdmin">
            <svg *ngIf="isManager" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <svg *ngIf="isStaff" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <svg *ngIf="isAdmin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>

          <div class="manager-scope-text">
            <div class="scope-header-line">
              <span class="scope-title">
                {{ isStaff ? 'Team Roster Schedule' : (isManager ? 'Private Manager Workspace' : 'Administrator Roster Console') }}
              </span>
              <span class="scope-badge" [class.badge-staff]="isStaff" [class.badge-manager]="isManager" [class.badge-admin]="isAdmin">
                {{ isStaff ? 'Staff Schedule View' : (isManager ? 'Full Manager Control' : 'Administrator') }}
              </span>
            </div>

            <div class="scope-subtitle-line">
              <span *ngIf="isStaff">
                Managed by: <strong>{{ currentRoster?.managerName || authService.currentUser?.managerName || 'Shift Operations Manager' }}</strong>
                — Viewing published shift schedules. Schedule edits and generation are managed by your team lead.
              </span>
              <span *ngIf="isManager">
                Manager: <strong>{{ authService.currentUser?.fullName }}</strong> ({{ authService.currentUser?.department || 'Operations' }})
                — All rosters, staff quotas, and historical cycles are private to your management account.
              </span>
              <span *ngIf="isAdmin">
                System Administrator View: Managing private manager rosters across departments.
              </span>
            </div>
          </div>

          <!-- Admin Manager Switcher -->
          <div *ngIf="isAdmin && adminManagers.length > 0" class="admin-manager-picker">
            <label class="picker-label">Switch Manager View:</label>
            <select class="form-control select-picker" [(ngModel)]="selectedAdminManagerId" (change)="onAdminManagerChange()">
              <option [ngValue]="null">All Managers</option>
              <option *ngFor="let m of adminManagers" [ngValue]="m.id">{{ m.fullName }} ({{ m.username }})</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{{ successMessage }}</span>
        <button class="alert-close-btn" (click)="clearMessages()">✕</button>
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>{{ errorMessage }}</span>
        <button class="alert-close-btn" (click)="clearMessages()">✕</button>
      </div>

      <!-- Controls Panel -->
      <div class="card mb-3 controls-card">
        <div class="roster-controls">
          <div class="control-group">
            <label class="control-label">Month</label>
            <select class="form-control select-control" [(ngModel)]="selectedMonth" (change)="onMonthYearChange()">
              <option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</option>
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">Year</label>
            <select class="form-control select-control" [(ngModel)]="selectedYear" (change)="onMonthYearChange()">
              <option *ngFor="let y of years" [value]="y">{{ y }}</option>
            </select>
          </div>

          <div class="control-group" *ngIf="!isStaff">
            <label class="control-label">Weekly Rest Days</label>
            <select class="form-control select-control" [(ngModel)]="weeklyOffPerEmployee">
              <option [ngValue]="2">2 Days / Week</option>
              <option [ngValue]="1">1 Day / Week</option>
            </select>
          </div>

          <div class="control-group quick-actions-group">
            <label class="control-label">{{ isStaff ? 'Schedule Action' : 'Operations' }}</label>
            <div class="quick-btns">
              <button *ngIf="canEdit" class="btn btn-primary" (click)="generateRoster()" [disabled]="loading">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                <span *ngIf="!loading">Generate Roster</span>
                <span *ngIf="loading">Generating...</span>
              </button>
              <button class="btn btn-secondary" (click)="loadRosterForMonth(selectedMonth, selectedYear)" [disabled]="loading">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                Load Schedule
              </button>
            </div>
          </div>

          <!-- Saved Rosters List -->
          <div class="control-group saved-rosters" *ngIf="allRosters.length > 0">
            <label class="control-label">Available Rosters ({{ allRosters.length }})</label>
            <div class="roster-pills">
              <button
                *ngFor="let r of allRosters"
                class="roster-pill"
                [class.active]="currentRoster && currentRoster.id === r.id"
                (click)="selectRoster(r)">
                <span>{{ getMonthName(r.month) }} {{ r.year }}</span>
                <span class="pill-badge" [class.badge-final]="r.status === 'FINALIZED'">
                  {{ r.status }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pre-Generation Historical Continuity & Cadence Inspection Panel (Managers & Admin Only) -->
      <div *ngIf="!isStaff && continuityContext" class="card mb-3 continuity-card">
        <div class="continuity-header">
          <div class="continuity-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <strong>Historical Continuity & Cadence Inspection</strong>
            <span class="badge badge-target">{{ continuityContext.targetMonthName }}</span>
          </div>
          <div class="continuity-status-badges">
            <span *ngIf="continuityContext.immediatePreviousAvailable" class="status-badge status-success">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Linked: {{ continuityContext.immediatePreviousMonthName }}
            </span>
            <span *ngIf="!continuityContext.immediatePreviousAvailable && continuityContext.totalHistoricalMonths > 0" class="status-badge status-warning">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {{ continuityContext.immediatePreviousMonthName }} Missing
            </span>
            <span class="status-badge status-invariant">
              Strict 5-Day Work Limit (Zero 6-Day Fatigue Weeks)
            </span>
          </div>
        </div>

        <div class="continuity-body">
          <p class="continuity-summary-msg">{{ continuityContext.statusMessage }}</p>

          <!-- Historical Months Found Pills -->
          <div class="historical-pills-row" *ngIf="continuityContext.historicalMonths.length > 0">
            <span class="hist-label">Inspected Previous Months:</span>
            <div class="hist-pills">
              <span *ngFor="let hm of continuityContext.historicalMonths" class="hist-pill">
                {{ hm.monthName }}
                <small class="hist-count">({{ hm.assignmentCount }} shifts)</small>
              </span>
            </div>
          </div>

          <!-- Audit details list -->
          <div class="audit-details-list">
            <div *ngFor="let detail of continuityContext.auditDetails" class="audit-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{{ detail }}</span>
            </div>
          </div>

          <!-- If immediate predecessor is missing, provide quick action -->
          <div *ngIf="!continuityContext.immediatePreviousAvailable && continuityContext.immediatePreviousMonth" class="predecessor-recommendation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Tip: For optimal rolling rest cycles and shift equality, generate <strong>{{ continuityContext.immediatePreviousMonthName }}</strong> first.</span>
            <button class="btn btn-sm btn-outline-warning" (click)="switchToImmediatePrevious()">
              Switch to {{ continuityContext.immediatePreviousMonthName }}
            </button>
          </div>
        </div>
      </div>

      <!-- Warnings Banner (Collapsible Dropdown) -->
      <div *ngIf="currentRoster && currentRoster.warnings && currentRoster.warnings.length > 0" class="warnings-banner card mb-3">
        <div class="warning-toggle-header" (click)="warningsExpanded = !warningsExpanded">
          <div class="warning-title-left">
            <svg class="warn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <strong>Roster Optimization Notices ({{ currentRoster.warnings.length }})</strong>
            <span class="warning-toggle-pill">{{ warningsExpanded ? 'Hide Notices' : 'Show Notices' }}</span>
          </div>
          <div class="warning-chevron" [class.rotated]="warningsExpanded">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <div *ngIf="warningsExpanded" class="warning-dropdown-body">
          <ul class="warning-list">
            <li *ngFor="let w of currentRoster.warnings">{{ w }}</li>
          </ul>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Processing roster optimization algorithms...</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !currentRoster" class="empty-state card">
        <div class="empty-icon-box">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
        <h3>{{ isStaff ? 'No Schedule Published Yet' : 'No Roster Selected' }}</h3>
        <p class="text-secondary">
          <span *ngIf="!isStaff">Select a target month and year above to generate an automated fair schedule, or load an existing roster from history.</span>
          <span *ngIf="isStaff">No shift roster has been published for {{ getMonthName(selectedMonth) }} {{ selectedYear }}. Please contact your operations manager ({{ authService.currentUser?.managerName || 'Lead Manager' }}).</span>
        </p>
        <button *ngIf="canEdit" class="btn btn-primary" (click)="generateRoster()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Generate for {{ getMonthName(selectedMonth) }} {{ selectedYear }}
        </button>
      </div>

      <!-- Main View Area -->
      <div *ngIf="!loading && currentRoster">
        <!-- View Toolbar -->
        <div class="view-toolbar card mb-2">
          <div class="view-tabs">
            <button class="tab-btn" [class.active]="activeTab === 'grid'" (click)="activeTab = 'grid'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Monthly Grid
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'analytics'" (click)="activeTab = 'analytics'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              Fairness & Analytics
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'daily-coverage'" (click)="activeTab = 'daily-coverage'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Daily Coverage Check
            </button>
          </div>

          <div class="toolbar-info">
            <span class="status-indicator" [class.finalized]="currentRoster.status === 'FINALIZED'">
              {{ currentRoster.status }}
            </span>
            <span class="stat-sep">•</span>
            <span>Staff: <strong>{{ uniqueEmployeeIds.length }}</strong></span>
            <span class="stat-sep">•</span>
            <span>Days: <strong>{{ daysInMonth.length }}</strong></span>
            <div class="filter-wrapper">
              <svg class="search-mini-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                class="form-control filter-input"
                placeholder="Filter staff..."
                [(ngModel)]="employeeFilter"
              />
            </div>
          </div>
        </div>

        <!-- TAB 1: MONTHLY GRID -->
        <div *ngIf="activeTab === 'grid'" class="card grid-card">
          <!-- Shift Legend -->
          <div class="legend-bar">
            <div class="legend-left">
              <span class="legend-title">Shift Key:</span>
              <div class="legend-items">
                <div *ngFor="let s of shifts" class="legend-item">
                  <span class="legend-badge" [style.background-color]="s.colorCode || '#1a73e8'">
                    {{ getShiftAbbreviation(s.shiftName) }}
                  </span>
                  <span>{{ s.shiftName }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-badge badge-off">OFF</span>
                  <span>Weekly Rest Day</span>
                </div>
              </div>
            </div>
            <div class="legend-tip" *ngIf="canEdit">
              Click any schedule cell to edit shift or mark day off
            </div>
            <div class="legend-tip text-muted" *ngIf="!canEdit">
              Staff Read-Only View • Schedule modifications restricted to Shift Operations Manager
            </div>
          </div>

          <!-- Calendar Matrix Table -->
          <div class="mobile-swipe-indicator">
            👈 Swipe horizontally to view full calendar & days 👉
          </div>
          <div class="matrix-wrapper">
            <table class="roster-matrix">
              <thead>
                <tr>
                  <th class="col-emp-header sticky-col">Employee Name</th>
                  <th
                    *ngFor="let day of daysInMonth"
                    class="col-day-header"
                    [class.col-weekend]="day.isWeekend"
                    [class.col-sunday]="day.isSunday">
                    <div class="day-dow">{{ day.dayOfWeek }}</div>
                    <div class="day-num">{{ day.dayNumber }}</div>
                  </th>
                  <th class="col-summary-header">Shifts</th>
                  <th class="col-summary-header">OFF</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let empId of filteredEmployeeIds">
                  <td class="sticky-col emp-name-cell">
                    <div class="emp-name-wrapper">
                      <span class="emp-avatar">{{ getEmployeeName(empId).charAt(0).toUpperCase() }}</span>
                      <span class="emp-name">{{ getEmployeeName(empId) }}</span>
                    </div>
                  </td>
                  <td
                    *ngFor="let day of daysInMonth"
                    class="shift-cell"
                    [class.readonly-cell]="!canEdit"
                    [class.cell-weekend]="day.isWeekend"
                    (click)="canEdit ? openEditModal(empId, day.dateStr) : null">
                    <div
                      class="shift-tag"
                      [style.background-color]="getShiftColor(empId, day.dateStr)"
                      [class.tag-off]="isOffDay(empId, day.dateStr)"
                      [class.tag-manual]="isManualEdit(empId, day.dateStr)"
                      [title]="(getEmployeeName(empId)) + ' - ' + day.dateStr + ': ' + getShiftDisplay(empId, day.dateStr)">
                      {{ getShiftDisplay(empId, day.dateStr) }}
                    </div>
                  </td>
                  <td class="col-summary-val count-shifts">
                    {{ getEmployeeShiftCount(empId) }}
                  </td>
                  <td class="col-summary-val count-off">
                    {{ getEmployeeOffCount(empId) }}
                  </td>
                </tr>
              </tbody>

              <!-- Daily Staffing Totals Footer -->
              <tfoot>
                <tr class="coverage-row" *ngFor="let s of shifts">
                  <td class="sticky-col coverage-label">
                    <span class="dot" [style.background-color]="s.colorCode || '#1a73e8'"></span>
                    <span>{{ s.shiftName }} Coverage</span>
                  </td>
                  <td
                    *ngFor="let day of daysInMonth"
                    class="coverage-cell"
                    [class.coverage-met]="isDailyStaffingMet(day.dateStr, s.shiftName, day.isWeekend)"
                    [class.coverage-deficit]="!isDailyStaffingMet(day.dateStr, s.shiftName, day.isWeekend)">
                    {{ getDailyShiftStaffCount(day.dateStr, s.shiftName) }}
                    <span class="req-small">/{{ getRequiredStaffCount(s, day.isWeekend) }}</span>
                  </td>
                  <td colspan="2" class="coverage-total">
                    {{ getTotalMonthlyShiftCount(s.shiftName) }} shifts
                  </td>
                </tr>
                <tr class="coverage-row off-row">
                  <td class="sticky-col coverage-label">
                    <span class="dot off-dot"></span>
                    <span>Total Staff Off</span>
                  </td>
                  <td *ngFor="let day of daysInMonth" class="coverage-cell off-coverage-cell">
                    {{ getDailyOffStaffCount(day.dateStr) }}
                  </td>
                  <td colspan="2" class="coverage-total"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- TAB 2: FAIRNESS & ANALYTICS -->
        <div *ngIf="activeTab === 'analytics'" class="analytics-container">
          <div class="grid-2-cols mb-3">
            <div class="card stat-summary-card">
              <div class="card-header">
                <h3>Workload Distribution</h3>
                <span class="badge badge-success">Balanced</span>
              </div>
              <p class="text-secondary mb-3">
                SmartRoster algorithms ensure fair distribution of night, weekday, and weekend work across all active personnel.
              </p>
              <div class="fairness-stats-grid">
                <div class="f-stat">
                  <div class="f-val">{{ getAverageShiftsPerEmployee() }}</div>
                  <div class="f-lbl">Avg Shifts / Staff</div>
                </div>
                <div class="f-stat">
                  <div class="f-val">{{ getAverageOffsPerEmployee() }}</div>
                  <div class="f-lbl">Avg Rest Days</div>
                </div>
                <div class="f-stat">
                  <div class="f-val">{{ getTotalMonthlyAssignments() }}</div>
                  <div class="f-lbl">Assigned Shifts</div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Shift Breakdown</h3>
              </div>
              <div class="shift-breakdown-list">
                <div *ngFor="let s of shifts" class="breakdown-item">
                  <div class="b-header">
                    <span class="b-name">
                      <span class="dot" [style.background-color]="s.colorCode"></span>
                      {{ s.shiftName }}
                    </span>
                    <span class="b-count">{{ getTotalMonthlyShiftCount(s.shiftName) }} slots ({{ getShiftPercentage(s.shiftName) }}%)</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      [style.background-color]="s.colorCode || '#1a73e8'"
                      [style.width.%]="getShiftPercentage(s.shiftName)">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Per-Employee Breakdown Table -->
          <div class="card">
            <div class="card-header">
              <h3>Per-Employee Workload Distribution</h3>
              <button class="btn btn-sm btn-secondary" (click)="exportExcel()">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export Excel
              </button>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th *ngFor="let s of shifts">{{ s.shiftName }}</th>
                    <th>Weekly Offs</th>
                    <th>Total Shifts</th>
                    <th>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let empId of uniqueEmployeeIds">
                    <td>
                      <strong class="text-heading">{{ getEmployeeName(empId) }}</strong>
                    </td>
                    <td *ngFor="let s of shifts">
                      {{ getEmployeeShiftTypeCount(empId, s.shiftName) }}
                    </td>
                    <td>
                      <span class="badge badge-info">{{ getEmployeeOffCount(empId) }} OFFs</span>
                    </td>
                    <td>
                      <strong>{{ getEmployeeShiftCount(empId) }}</strong>
                    </td>
                    <td>
                      <span class="badge badge-success">Balanced</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 3: DAILY COVERAGE CHECK -->
        <div *ngIf="activeTab === 'daily-coverage'" class="card">
          <div class="card-header">
            <h3>Daily Staffing Quota vs Actual Coverage</h3>
          </div>
          <p class="text-secondary mb-3">Verification breakdown confirming required weekday and weekend staffing minimums are satisfied for each day of the month.</p>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Type</th>
                  <th *ngFor="let s of shifts">{{ s.shiftName }} (Req / Act)</th>
                  <th>Off Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let day of daysInMonth">
                  <td><strong>{{ day.dateStr }}</strong></td>
                  <td>{{ day.dayOfWeek }}</td>
                  <td>
                    <span class="badge" [class.badge-warning]="day.isWeekend" [class.badge-info]="!day.isWeekend">
                      {{ day.isWeekend ? 'Weekend' : 'Weekday' }}
                    </span>
                  </td>
                  <td *ngFor="let s of shifts">
                    <span [class.text-danger]="!isDailyStaffingMet(day.dateStr, s.shiftName, day.isWeekend)">
                      Required: {{ getRequiredStaffCount(s, day.isWeekend) }} | Assigned: {{ getDailyShiftStaffCount(day.dateStr, s.shiftName) }}
                    </span>
                  </td>
                  <td>{{ getDailyOffStaffCount(day.dateStr) }}</td>
                  <td>
                    <span
                      class="badge"
                      [class.badge-success]="isAllStaffingMetForDay(day)"
                      [class.badge-danger]="!isAllStaffingMetForDay(day)">
                      {{ isAllStaffingMetForDay(day) ? 'Satisfied' : 'Deficit' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Cell Edit Modal -->
      <div *ngIf="showEditModal" class="modal-backdrop" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Modify Shift Assignment</h3>
            <button class="modal-close" (click)="closeEditModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="modal-emp-info">
              <div><span class="text-muted">Staff:</span> <strong>{{ editEmployeeName }}</strong></div>
              <div><span class="text-muted">Date:</span> <strong>{{ editDate }}</strong></div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">Select Shift Assignment</label>
              <div class="shift-radio-group">
                <label
                  *ngFor="let s of shifts"
                  class="shift-radio-card"
                  [class.selected]="!editIsWeeklyOff && editSelectedShift === s.shiftName"
                  (click)="selectModalShift(s.shiftName, false)">
                  <span class="dot" [style.background-color]="s.colorCode || '#1a73e8'"></span>
                  <div class="radio-label">
                    <strong>{{ s.shiftName }}</strong>
                    <small class="text-muted">Demand: {{ s.weekdayCount }} (Wkday) / {{ s.weekendCount }} (Wkend)</small>
                  </div>
                </label>

                <label
                  class="shift-radio-card"
                  [class.selected]="editIsWeeklyOff"
                  (click)="selectModalShift(null, true)">
                  <span class="dot off-dot"></span>
                  <div class="radio-label">
                    <strong>Scheduled Weekly OFF</strong>
                    <small class="text-muted">Assigned Rest Day</small>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveAssignmentEdit()" [disabled]="loading">
              Save Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .subtitle {
      font-size: 0.85rem;
      margin-top: 4px;
    }

    .alert-close-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 0.85rem;
      opacity: 0.8;
      transition: opacity var(--transition-fast);
    }

    .alert-close-btn:hover {
      opacity: 1;
    }

    /* Manager Scope Banner */
    .manager-scope-banner {
      padding: 1rem 1.25rem;
      background: linear-gradient(90deg, rgba(20, 24, 38, 0.95) 0%, rgba(15, 18, 30, 0.95) 100%);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--accent-primary);
    }

    .manager-scope-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .manager-scope-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: rgba(26, 115, 232, 0.15);
      color: var(--accent-primary-light);
      border: 1px solid rgba(26, 115, 232, 0.3);
    }

    .manager-scope-icon.staff-icon {
      background: rgba(0, 188, 212, 0.15);
      color: #26c6da;
      border-color: rgba(0, 188, 212, 0.3);
    }

    .manager-scope-icon.manager-icon {
      background: rgba(249, 171, 0, 0.15);
      color: var(--accent-warning);
      border-color: rgba(249, 171, 0, 0.3);
    }

    .manager-scope-icon.admin-icon {
      background: rgba(156, 39, 176, 0.15);
      color: #ce93d8;
      border-color: rgba(156, 39, 176, 0.3);
    }

    .manager-scope-text {
      flex: 1;
      min-width: 250px;
    }

    .scope-header-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }

    .scope-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-heading);
    }

    .scope-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .badge-staff {
      background: rgba(0, 188, 212, 0.15);
      color: #26c6da;
      border: 1px solid rgba(0, 188, 212, 0.35);
    }

    .badge-manager {
      background: rgba(249, 171, 0, 0.15);
      color: var(--accent-warning);
      border: 1px solid rgba(249, 171, 0, 0.35);
    }

    .badge-admin {
      background: rgba(156, 39, 176, 0.15);
      color: #ce93d8;
      border: 1px solid rgba(156, 39, 176, 0.35);
    }

    .scope-subtitle-line {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .admin-manager-picker {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .picker-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .select-picker {
      min-width: 180px;
      padding: 6px 10px;
      font-size: 0.8rem;
    }

    .readonly-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.78rem;
      font-weight: 600;
    }

    /* Continuity Card */
    .continuity-card {
      padding: 1.25rem 1.5rem;
      border-left: 4px solid var(--accent-primary);
      background: var(--bg-card);
    }

    .continuity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .continuity-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      color: var(--text-heading);
    }

    .badge-target {
      background: rgba(26, 115, 232, 0.15);
      color: var(--accent-primary-light);
      border: 1px solid rgba(26, 115, 232, 0.4);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .continuity-status-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 14px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .status-badge.status-success {
      background: rgba(19, 115, 51, 0.18);
      color: var(--accent-success-light);
      border: 1px solid rgba(19, 115, 51, 0.4);
    }

    .status-badge.status-warning {
      background: rgba(249, 171, 0, 0.15);
      color: var(--accent-warning);
      border: 1px solid rgba(249, 171, 0, 0.4);
    }

    .status-badge.status-invariant {
      background: rgba(26, 115, 232, 0.12);
      color: var(--accent-primary-light);
      border: 1px solid rgba(26, 115, 232, 0.3);
    }

    .continuity-summary-msg {
      font-size: 0.85rem;
      color: var(--text-primary);
      margin-bottom: 0.75rem;
    }

    .historical-pills-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 0.75rem;
    }

    .hist-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .hist-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .hist-pill {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      color: var(--text-primary);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .hist-count {
      color: var(--text-muted);
      font-size: 0.7rem;
    }

    .audit-details-list {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: 6px;
    }

    .audit-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    .audit-item svg {
      color: var(--accent-success-light);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .predecessor-recommendation {
      margin-top: 10px;
      padding: 10px 14px;
      background: rgba(249, 171, 0, 0.08);
      border: 1px solid rgba(249, 171, 0, 0.25);
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 0.8rem;
      color: var(--accent-warning);
    }

    .btn-outline-warning {
      background: transparent;
      border: 1px solid var(--accent-warning);
      color: var(--accent-warning);
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      transition: all var(--transition-fast);
      margin-left: auto;
    }

    .btn-outline-warning:hover {
      background: var(--accent-warning);
      color: #000;
    }

    .controls-card {
      padding: 1.25rem 1.5rem;
    }

    .roster-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      align-items: flex-end;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .control-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .select-control {
      min-width: 140px;
    }

    .quick-actions-group {
      flex-shrink: 0;
    }

    .quick-btns {
      display: flex;
      gap: 8px;
    }

    .saved-rosters {
      flex: 1;
      min-width: 240px;
    }

    .roster-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 80px;
      overflow-y: auto;
    }

    .roster-pill {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition-fast);
    }

    .roster-pill:hover {
      border-color: var(--border-hover);
      background: var(--bg-card-hover);
    }

    .roster-pill.active {
      border-color: var(--accent-primary);
      background: rgba(26, 115, 232, 0.15);
      color: #fff;
      font-weight: 600;
    }

    .pill-badge {
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 10px;
      background: rgba(249, 171, 0, 0.15);
      color: var(--accent-warning);
    }

    .pill-badge.badge-final {
      background: rgba(52, 168, 83, 0.15);
      color: var(--accent-success-light);
      border: 1px solid rgba(52, 168, 83, 0.3);
    }

    /* Warnings Banner Collapsible Dropdown */
    .warnings-banner {
      background: rgba(249, 171, 0, 0.06);
      border: 1px solid rgba(249, 171, 0, 0.28);
      padding: 0 !important;
      overflow: hidden;
      border-radius: var(--radius-lg);
    }

    .warning-toggle-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 1rem 1.25rem;
      cursor: pointer;
      user-select: none;
      transition: background var(--transition-fast);
      gap: 12px;
    }

    .warning-toggle-header:hover {
      background: rgba(249, 171, 0, 0.12);
    }

    .warning-title-left {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--accent-warning);
      font-size: 0.95rem;
      flex-wrap: wrap;
    }

    .warn-icon {
      flex-shrink: 0;
      color: var(--accent-warning);
    }

    .warning-toggle-pill {
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      background: rgba(249, 171, 0, 0.18);
      color: var(--accent-warning);
      border: 1px solid rgba(249, 171, 0, 0.35);
      padding: 3px 9px;
      border-radius: 12px;
    }

    .warning-chevron {
      color: var(--accent-warning);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--transition-fast);
      flex-shrink: 0;
    }

    .warning-chevron.rotated {
      transform: rotate(180deg);
    }

    .warning-dropdown-body {
      padding: 0 1.25rem 1.25rem 1.25rem;
      border-top: 1px solid rgba(249, 171, 0, 0.18);
      padding-top: 1rem;
      animation: fadeIn 0.2s ease;
    }

    .warning-list {
      margin: 0;
      padding-left: 1.5rem;
      color: var(--text-primary);
      font-size: 0.9rem;
    }

    .warning-list li {
      margin-bottom: 6px;
      line-height: 1.5;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
    }

    .empty-icon-box {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      color: var(--text-muted);
    }

    .empty-state h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      max-width: 500px;
      margin: 0 auto 1.5rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* View Toolbar */
    .view-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
    }

    .view-tabs {
      display: flex;
      gap: 6px;
    }

    .tab-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all var(--transition-fast);
    }

    .tab-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    .tab-btn.active {
      background: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
      box-shadow: 0 2px 8px rgba(26, 115, 232, 0.35);
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.82rem;
      color: var(--text-secondary);
    }

    .filter-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-mini-icon {
      position: absolute;
      left: 8px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .filter-input {
      width: 150px;
      padding: 5px 8px 5px 26px;
      font-size: 0.78rem;
    }

    .stat-sep {
      color: var(--border-color);
    }

    .status-indicator {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(249, 171, 0, 0.15);
      color: var(--accent-warning);
    }

    .status-indicator.finalized {
      background: rgba(52, 168, 83, 0.15);
      color: var(--accent-success-light);
      border: 1px solid rgba(52, 168, 83, 0.3);
    }

    /* Legend */
    .legend-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 0.85rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .legend-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .legend-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--text-primary);
    }

    .legend-badge {
      min-width: 28px;
      height: 22px;
      padding: 0 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      font-size: 0.7rem;
    }

    .legend-badge.badge-off {
      background: #1c1d24;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }

    .legend-tip {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Matrix Table */
    .grid-card {
      padding: 1.25rem;
      overflow: hidden;
    }

    .matrix-wrapper {
      max-width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-primary);
    }

    .roster-matrix {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 0.8rem;
    }

    .roster-matrix th,
    .roster-matrix td {
      border-right: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      text-align: center;
      padding: 6px 4px;
      min-width: 38px;
    }

    .sticky-col {
      position: sticky;
      left: 0;
      background: var(--bg-card);
      z-index: 10;
      min-width: 180px !important;
      text-align: left !important;
      padding-left: 14px !important;
      border-right: 2px solid var(--border-hover) !important;
    }

    .col-emp-header {
      background: var(--bg-secondary) !important;
      font-weight: 700;
      color: var(--text-heading);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .col-day-header {
      background: var(--bg-secondary);
      padding: 8px 4px !important;
    }

    .day-dow {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .day-num {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-heading);
    }

    .col-weekend {
      background: rgba(26, 115, 232, 0.05) !important;
      border-bottom: 2px solid rgba(26, 115, 232, 0.3) !important;
    }

    .col-sunday {
      background: rgba(26, 115, 232, 0.09) !important;
      border-bottom: 2px solid var(--accent-primary) !important;
    }

    .col-summary-header {
      background: var(--bg-secondary);
      min-width: 55px !important;
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 700;
      text-transform: uppercase;
    }

    .emp-name-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .emp-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary) 0%, #1558b0 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .emp-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }

    .shift-cell {
      cursor: pointer;
      transition: background var(--transition-fast);
      padding: 4px 2px !important;
    }

    .shift-cell:hover {
      background: rgba(26, 115, 232, 0.15) !important;
    }

    .shift-cell.readonly-cell {
      cursor: default !important;
    }

    .shift-cell.readonly-cell:hover {
      background: inherit !important;
    }

    .shift-cell.readonly-cell .shift-tag:hover {
      transform: none !important;
    }

    .cell-weekend {
      background: rgba(255, 255, 255, 0.01);
    }

    .shift-tag {
      display: inline-block;
      width: 34px;
      height: 26px;
      line-height: 26px;
      border-radius: 4px;
      font-weight: 700;
      color: #fff;
      font-size: 0.7rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
      transition: transform var(--transition-fast);
      user-select: none;
    }

    .shift-tag:hover {
      transform: scale(1.1);
    }

    .tag-off {
      background: #181920 !important;
      color: #717582 !important;
      font-weight: 700;
      border: 1px solid #282a32;
      box-shadow: none;
    }

    .tag-manual {
      box-shadow: 0 0 0 2px var(--accent-warning);
    }

    .col-summary-val {
      font-weight: 700;
      font-size: 0.85rem;
    }

    .count-shifts {
      color: var(--accent-primary-light);
      background: rgba(26, 115, 232, 0.05);
    }

    .count-off {
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.02);
    }

    /* Footer Coverage Rows */
    .coverage-row td {
      font-weight: 600;
      font-size: 0.75rem;
      background: var(--bg-secondary);
    }

    .coverage-label {
      font-size: 0.75rem !important;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .off-dot {
      background: #717582;
    }

    .coverage-cell {
      padding: 6px 2px !important;
    }

    .coverage-met {
      color: var(--accent-success-light);
    }

    .coverage-deficit {
      color: var(--accent-danger-light);
      background: rgba(234, 67, 53, 0.15) !important;
      font-weight: 800;
    }

    .off-coverage-cell {
      color: var(--text-secondary);
    }

    .req-small {
      font-size: 0.65rem;
      opacity: 0.7;
    }

    .coverage-total {
      font-weight: 700;
      color: var(--text-primary);
      text-align: center;
    }

    /* Analytics Tab */
    .grid-2-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .fairness-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .f-stat {
      background: var(--bg-secondary);
      padding: 1.25rem 0.75rem;
      border-radius: var(--radius-md);
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .f-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--accent-primary-light);
    }

    .f-lbl {
      font-size: 0.72rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 4px;
    }

    .shift-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .breakdown-item .b-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      font-size: 0.85rem;
    }

    .b-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .b-count {
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .progress-bar-bg {
      height: 8px;
      background: var(--bg-primary);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    /* Modal */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
      font-size: 1.15rem;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-emp-info {
      background: var(--bg-secondary);
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      border: 1px solid var(--border-color);
    }

    .shift-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .shift-radio-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .shift-radio-card:hover {
      border-color: var(--border-hover);
      background: var(--bg-card-hover);
    }

    .shift-radio-card.selected {
      border-color: var(--accent-primary);
      background: rgba(26, 115, 232, 0.12);
    }

    .radio-label {
      display: flex;
      flex-direction: column;
    }

    .radio-label small {
      font-size: 0.72rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 900px) {
      .grid-2-cols {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .manager-scope-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.85rem;
      }

      .scope-title {
        font-size: 1.15rem !important;
        font-weight: 800;
      }

      .scope-badge {
        font-size: 0.82rem !important;
        padding: 4px 10px !important;
      }

      .scope-subtitle-line {
        font-size: 0.92rem !important;
        line-height: 1.5;
      }

      .admin-manager-picker {
        width: 100%;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }

      .picker-label {
        font-size: 0.88rem !important;
        font-weight: 700;
      }

      .select-picker {
        width: 100%;
        font-size: 1rem !important;
        min-height: 48px;
      }

      .roster-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .control-group {
        width: 100%;
      }

      .control-label {
        font-size: 0.88rem !important;
        font-weight: 800 !important;
        margin-bottom: 6px;
      }

      .select-control {
        width: 100% !important;
        min-width: 100% !important;
        font-size: 1rem !important;
        min-height: 48px;
      }

      .quick-btns {
        width: 100%;
        display: flex;
        gap: 10px;
      }

      .quick-btns .btn {
        flex: 1;
        justify-content: center;
        font-size: 0.95rem !important;
        font-weight: 800 !important;
        min-height: 48px;
        padding: 12px 14px !important;
      }

      .saved-rosters {
        min-width: 100%;
      }

      .roster-pills {
        gap: 8px;
      }

      .roster-pill {
        padding: 10px 14px !important;
        font-size: 0.92rem !important;
        min-height: 44px;
      }

      .pill-badge {
        font-size: 0.78rem !important;
      }

      .continuity-title {
        font-size: 1.1rem !important;
      }

      .continuity-summary-msg {
        font-size: 0.92rem !important;
      }

      .audit-item {
        font-size: 0.88rem !important;
      }

      .view-toolbar {
        flex-direction: column;
        align-items: stretch !important;
        gap: 1rem !important;
        padding: 1rem !important;
      }

      .view-tabs {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .tab-btn {
        width: 100%;
        justify-content: center;
        padding: 11px 14px !important;
        font-size: 0.95rem !important;
        font-weight: 700;
        min-height: 46px;
      }

      .toolbar-info {
        flex-wrap: wrap;
        width: 100%;
        gap: 10px;
        justify-content: space-between;
        font-size: 0.92rem !important;
      }

      .filter-wrapper {
        width: 100% !important;
        margin-top: 6px;
      }

      .filter-input {
        width: 100% !important;
        font-size: 1rem !important;
        min-height: 46px;
      }

      .legend-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.85rem;
      }

      .legend-items {
        gap: 10px;
      }

      .legend-item {
        font-size: 0.88rem !important;
      }

      .legend-badge {
        min-width: 32px;
        height: 26px;
        font-size: 0.78rem !important;
      }

      .legend-tip {
        font-size: 0.88rem !important;
      }

      .mobile-swipe-indicator {
        display: block !important;
        text-align: center;
        font-size: 0.85rem !important;
        font-weight: 700;
        color: var(--accent-primary-light);
        background: rgba(26, 115, 232, 0.12);
        border: 1px dashed rgba(26, 115, 232, 0.35);
        border-radius: var(--radius-sm);
        padding: 8px 12px;
        margin-bottom: 10px;
      }

      .matrix-wrapper {
        max-height: 65vh;
        -webkit-overflow-scrolling: touch;
        width: 100% !important;
        max-width: 100% !important;
      }

      .col-emp-header,
      .sticky-col {
        position: sticky;
        left: 0;
        z-index: 5;
        min-width: 130px !important;
        max-width: 130px !important;
        width: 130px !important;
        padding: 6px 8px !important;
      }

      .emp-name-wrapper {
        gap: 6px;
      }

      .emp-avatar {
        width: 24px;
        height: 24px;
        font-size: 0.75rem;
      }

      .emp-name {
        font-size: 0.92rem !important;
        font-weight: 700;
        max-width: 85px !important;
      }

      .day-dow {
        font-size: 0.72rem !important;
      }

      .day-num {
        font-size: 0.95rem !important;
        font-weight: 800;
      }

      .shift-cell {
        min-width: 36px !important;
        padding: 3px 1px !important;
      }

      .col-day-header {
        min-width: 36px !important;
        padding: 6px 2px !important;
      }

      .shift-tag {
        width: 34px !important;
        height: 28px !important;
        line-height: 28px !important;
        font-size: 0.78rem !important;
        font-weight: 800;
      }

      .col-summary-val {
        font-size: 0.95rem !important;
      }

      .coverage-label {
        font-size: 0.85rem !important;
      }

      .coverage-cell {
        font-size: 0.85rem !important;
      }

      .fairness-stats-grid {
        grid-template-columns: 1fr !important;
        gap: 0.85rem;
      }

      .f-val {
        font-size: 2.2rem !important;
      }

      .f-lbl {
        font-size: 0.88rem !important;
        font-weight: 700;
      }

      .breakdown-item .b-header {
        font-size: 0.95rem !important;
      }

      .b-count {
        font-size: 0.88rem !important;
      }

      .shift-radio-card {
        padding: 14px !important;
      }

      .radio-label strong {
        font-size: 1.05rem !important;
      }

      .radio-label small {
        font-size: 0.82rem !important;
      }
    }
  `]
})
export class RosterComponent implements OnInit {
  currentRoster: Roster | null = null;
  allRosters: Roster[] = [];
  shifts: ShiftConfig[] = [];
  employees: Employee[] = [];
  continuityContext: ContinuityContext | null = null;

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  weeklyOffPerEmployee: number = 2;

  adminManagers: ManagerSummary[] = [];
  selectedAdminManagerId: number | null = null;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  years: number[] = [];

  activeTab: 'grid' | 'analytics' | 'daily-coverage' = 'grid';
  employeeFilter: string = '';
  warningsExpanded = false;

  daysInMonth: DayColumn[] = [];
  uniqueEmployeeIds: number[] = [];

  // Edit Modal State
  showEditModal = false;
  editEmployeeId: number | null = null;
  editEmployeeName: string = '';
  editDate: string = '';
  editSelectedShift: string | null = null;
  editIsWeeklyOff: boolean = false;

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private rosterService: RosterService,
    private shiftService: ShiftConfigService,
    private employeeService: EmployeeService,
    public authService: AuthService
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 3; y++) {
      this.years.push(y);
    }
  }

  get isStaff(): boolean {
    return this.authService.isStaff;
  }

  get isManager(): boolean {
    return this.authService.isManager;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get canEdit(): boolean {
    return this.authService.canManageRoster;
  }

  get targetManagerId(): number | undefined {
    if (this.isAdmin) {
      return this.selectedAdminManagerId ?? undefined;
    }
    if (this.isManager) {
      return this.authService.currentUser?.id;
    }
    return this.authService.currentUser?.managerId;
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.checkContinuityContext();
  }

  loadInitialData(): void {
    if (this.isAdmin) {
      this.authService.getManagers().subscribe({
        next: (mgrs) => (this.adminManagers = mgrs),
        error: (err) => console.error('Error loading managers for admin', err)
      });
    }

    this.shiftService.getShiftConfigs().subscribe({
      next: (shifts: ShiftConfig[]) => (this.shifts = shifts),
      error: (err: any) => console.error('Error loading shifts', err)
    });

    this.employeeService.getEmployees().subscribe({
      next: (emps: Employee[]) => (this.employees = emps),
      error: (err: any) => console.error('Error loading employees', err)
    });

    this.loadAllRosters();
  }

  onAdminManagerChange(): void {
    this.currentRoster = null;
    this.loadAllRosters();
    this.checkContinuityContext();
    this.loadRosterForMonth(this.selectedMonth, this.selectedYear);
  }

  loadAllRosters(): void {
    this.rosterService.getAllRosters(this.targetManagerId).subscribe({
      next: (rosters) => {
        this.allRosters = rosters;
        const found = rosters.find(
          (r) => r.month === this.selectedMonth && r.year === this.selectedYear
        );
        if (found && !this.currentRoster) {
          this.selectRoster(found);
        }
      },
      error: (err) => console.error('Error fetching rosters', err)
    });
  }

  checkContinuityContext(): void {
    this.rosterService.getContinuityContext(this.selectedMonth, this.selectedYear, this.targetManagerId).subscribe({
      next: (ctx) => (this.continuityContext = ctx),
      error: (err) => console.error('Error checking continuity context', err)
    });
  }

  switchToImmediatePrevious(): void {
    if (this.continuityContext?.immediatePreviousMonth && this.continuityContext?.immediatePreviousYear) {
      this.selectedMonth = this.continuityContext.immediatePreviousMonth;
      this.selectedYear = this.continuityContext.immediatePreviousYear;
      this.onMonthYearChange();
    }
  }

  onMonthYearChange(): void {
    this.computeDaysInMonth();
    this.checkContinuityContext();
    this.loadRosterForMonth(this.selectedMonth, this.selectedYear);
  }

  loadRosterForMonth(month: number, year: number): void {
    this.loading = true;
    this.clearMessages();
    this.rosterService.getRosterByMonth(month, year, this.targetManagerId).subscribe({
      next: (roster) => {
        this.loading = false;
        if (roster && roster.assignments && roster.assignments.length > 0) {
          this.setCurrentRoster(roster);
        } else {
          this.currentRoster = null;
        }
      },
      error: () => {
        this.loading = false;
        this.currentRoster = null;
      }
    });
  }

  generateRoster(): void {
    if (!this.canEdit) {
      this.errorMessage = 'Permission denied: Staff accounts have read-only access to rosters.';
      return;
    }

    this.clearMessages();

    const existingRoster = this.allRosters.find(
      (r) => r.month === this.selectedMonth && r.year === this.selectedYear
    );
    if (existingRoster) {
      if (!confirm(
        `A roster for ${this.getMonthName(this.selectedMonth)} ${this.selectedYear} already exists (Status: ${existingRoster.status}). ` +
        `Do you want to regenerate it? This will replace all existing assignments.`
      )) {
        return;
      }
    }

    this.loading = true;

    const request: GenerateRosterRequest = {
      month: this.selectedMonth,
      year: this.selectedYear,
      weeklyOffPerEmployee: this.weeklyOffPerEmployee,
      managerId: this.targetManagerId
    };

    this.rosterService.generateRoster(request).subscribe({
      next: (roster) => {
        this.loading = false;
        this.setCurrentRoster(roster);
        this.successMessage = `Roster for ${this.getMonthName(this.selectedMonth)} ${this.selectedYear} generated successfully`;
        this.loadAllRosters();
        this.checkContinuityContext();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || err.message || 'Failed to generate roster. Please check employee count and shift requirements.';
      }
    });
  }

  selectRoster(r: Roster): void {
    this.selectedMonth = r.month;
    this.selectedYear = r.year;
    this.weeklyOffPerEmployee = r.weeklyOffPerEmployee || 2;
    this.checkContinuityContext();
    if (r.id) {
      this.rosterService.getRoster(r.id).subscribe({
        next: (fullRoster) => this.setCurrentRoster(fullRoster),
        error: (err) => console.error('Error fetching roster details', err)
      });
    } else {
      this.setCurrentRoster(r);
    }
  }

  private setCurrentRoster(roster: Roster): void {
    this.currentRoster = roster;
    this.computeDaysInMonth();
    this.extractUniqueEmployees();
  }

  computeDaysInMonth(): void {
    this.daysInMonth = [];
    const date = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (date.getMonth() === this.selectedMonth - 1) {
      const dayNum = date.getDate();
      const dowIndex = date.getDay();
      const isSat = dowIndex === 6;
      const isSun = dowIndex === 0;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      this.daysInMonth.push({
        dayNumber: dayNum,
        dateStr: dateStr,
        dayOfWeek: dayNames[dowIndex],
        isWeekend: isSat || isSun,
        isSaturday: isSat,
        isSunday: isSun
      });

      date.setDate(date.getDate() + 1);
    }
  }

  extractUniqueEmployees(): void {
    if (!this.currentRoster || !this.currentRoster.assignments) {
      this.uniqueEmployeeIds = [];
      return;
    }

    const ids = new Set<number>();
    this.currentRoster.assignments.forEach((a) => ids.add(a.employeeId));
    this.uniqueEmployeeIds = Array.from(ids);
  }

  get filteredEmployeeIds(): number[] {
    if (!this.employeeFilter.trim()) {
      return this.uniqueEmployeeIds;
    }
    const q = this.employeeFilter.toLowerCase();
    return this.uniqueEmployeeIds.filter((id) =>
      this.getEmployeeName(id).toLowerCase().includes(q)
    );
  }

  getEmployeeName(employeeId: number): string {
    const found = this.employees.find((e) => e.id === employeeId);
    if (found) return found.name;

    const assignment = this.currentRoster?.assignments?.find(
      (a) => a.employeeId === employeeId
    );
    return assignment?.employeeName || `Employee #${employeeId}`;
  }

  getAssignment(employeeId: number, dateStr: string): RosterAssignment | undefined {
    return this.currentRoster?.assignments?.find(
      (a) => a.employeeId === employeeId && a.assignmentDate === dateStr
    );
  }

  getShiftDisplay(employeeId: number, dateStr: string): string {
    const a = this.getAssignment(employeeId, dateStr);
    if (!a) return '-';
    if (a.isWeeklyOff) return 'OFF';
    return a.shiftName ? this.getShiftAbbreviation(a.shiftName) : '-';
  }

  getShiftAbbreviation(shiftName: string): string {
    if (!shiftName) return '-';
    return shiftName.substring(0, 2).toUpperCase();
  }

  getShiftColor(employeeId: number, dateStr: string): string {
    const a = this.getAssignment(employeeId, dateStr);
    if (!a || a.isWeeklyOff || !a.shiftName) return 'transparent';

    const shift = this.shifts.find(
      (s) => s.shiftName.toLowerCase() === a.shiftName?.toLowerCase()
    );
    return shift?.colorCode || 'var(--accent-primary)';
  }

  isOffDay(employeeId: number, dateStr: string): boolean {
    const a = this.getAssignment(employeeId, dateStr);
    return !!a?.isWeeklyOff;
  }

  isManualEdit(employeeId: number, dateStr: string): boolean {
    const a = this.getAssignment(employeeId, dateStr);
    return !!a?.isManualEdit;
  }

  getEmployeeShiftCount(employeeId: number): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter(
      (a) => a.employeeId === employeeId && !a.isWeeklyOff && a.shiftName
    ).length;
  }

  getEmployeeOffCount(employeeId: number): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter(
      (a) => a.employeeId === employeeId && a.isWeeklyOff
    ).length;
  }

  getEmployeeShiftTypeCount(employeeId: number, shiftName: string): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter(
      (a) =>
        a.employeeId === employeeId &&
        !a.isWeeklyOff &&
        a.shiftName?.toLowerCase() === shiftName.toLowerCase()
    ).length;
  }

  getDailyShiftStaffCount(dateStr: string, shiftName: string): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter(
      (a) =>
        a.assignmentDate === dateStr &&
        !a.isWeeklyOff &&
        a.shiftName?.toLowerCase() === shiftName.toLowerCase()
    ).length;
  }

  getDailyOffStaffCount(dateStr: string): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter(
      (a) => a.assignmentDate === dateStr && a.isWeeklyOff
    ).length;
  }

  getRequiredStaffCount(shift: ShiftConfig, isWeekend: boolean): number {
    return isWeekend ? shift.weekendCount : shift.weekdayCount;
  }

  isDailyStaffingMet(dateStr: string, shiftName: string, isWeekend: boolean): boolean {
    const shift = this.shifts.find(
      (s) => s.shiftName.toLowerCase() === shiftName.toLowerCase()
    );
    if (!shift) return true;
    const req = this.getRequiredStaffCount(shift, isWeekend);
    const actual = this.getDailyShiftStaffCount(dateStr, shiftName);
    return actual >= req;
  }

  isAllStaffingMetForDay(day: DayColumn): boolean {
    return this.shifts.every((s) =>
      this.isDailyStaffingMet(day.dateStr, s.shiftName, day.isWeekend)
    );
  }

  getTotalMonthlyShiftCount(shiftName: string): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter(
      (a) =>
        !a.isWeeklyOff &&
        a.shiftName?.toLowerCase() === shiftName.toLowerCase()
    ).length;
  }

  getTotalMonthlyAssignments(): number {
    if (!this.currentRoster?.assignments) return 0;
    return this.currentRoster.assignments.filter((a) => !a.isWeeklyOff && a.shiftName).length;
  }

  getShiftPercentage(shiftName: string): number {
    const total = this.getTotalMonthlyAssignments();
    if (total === 0) return 0;
    return Math.round((this.getTotalMonthlyShiftCount(shiftName) / total) * 100);
  }

  getAverageShiftsPerEmployee(): number {
    if (this.uniqueEmployeeIds.length === 0) return 0;
    const total = this.getTotalMonthlyAssignments();
    return +(total / this.uniqueEmployeeIds.length).toFixed(1);
  }

  getAverageOffsPerEmployee(): number {
    if (this.uniqueEmployeeIds.length === 0 || !this.currentRoster?.assignments) return 0;
    const totalOffs = this.currentRoster.assignments.filter((a) => a.isWeeklyOff).length;
    return +(totalOffs / this.uniqueEmployeeIds.length).toFixed(1);
  }

  openEditModal(employeeId: number, dateStr: string): void {
    const a = this.getAssignment(employeeId, dateStr);
    this.editEmployeeId = employeeId;
    this.editEmployeeName = this.getEmployeeName(employeeId);
    this.editDate = dateStr;
    this.editSelectedShift = a?.shiftName || null;
    this.editIsWeeklyOff = !!a?.isWeeklyOff;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  selectModalShift(shiftName: string | null, isOff: boolean): void {
    this.editSelectedShift = shiftName;
    this.editIsWeeklyOff = isOff;
  }

  saveAssignmentEdit(): void {
    if (!this.currentRoster?.id || this.editEmployeeId === null) return;

    this.loading = true;
    const update: AssignmentUpdate = {
      employeeId: this.editEmployeeId,
      assignmentDate: this.editDate,
      shiftName: this.editIsWeeklyOff ? null : this.editSelectedShift,
      isWeeklyOff: this.editIsWeeklyOff
    };

    this.rosterService
      .updateAssignments(this.currentRoster.id, { updates: [update] })
      .subscribe({
        next: (updated) => {
          this.loading = false;
          this.setCurrentRoster(updated);
          this.closeEditModal();
          this.successMessage = `Assignment updated for ${this.editEmployeeName} on ${this.editDate}`;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Failed to update assignment.';
        }
      });
  }

  finalizeCurrentRoster(): void {
    if (!this.currentRoster?.id) return;
    if (!confirm('Are you sure you want to finalize this roster? It will lock the schedule.')) return;

    this.loading = true;
    this.rosterService.finalizeRoster(this.currentRoster.id).subscribe({
      next: (finalized) => {
        this.loading = false;
        this.setCurrentRoster(finalized);
        this.successMessage = 'Roster successfully marked as FINALIZED.';
        this.loadAllRosters();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to finalize roster.';
      }
    });
  }

  exportExcel(): void {
    if (!this.currentRoster?.id) return;

    this.loading = true;
    this.rosterService.exportToExcel(this.currentRoster.id).subscribe({
      next: (blob) => {
        this.loading = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SmartRoster_${this.getMonthName(this.selectedMonth)}_${this.selectedYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.successMessage = 'Excel spreadsheet downloaded successfully';
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to download Excel export.';
      }
    });
  }

  getMonthName(monthNum: number): string {
    return this.months[monthNum - 1] || `Month ${monthNum}`;
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  deleteCurrentRoster(): void {
    if (!this.currentRoster?.id) return;

    const monthName = this.getMonthName(this.currentRoster.month);
    const year = this.currentRoster.year;

    if (!confirm(`Are you sure you want to permanently remove the roster for ${monthName} ${year}? This action cannot be undone.`)) {
      return;
    }

    this.loading = true;
    this.clearMessages();
    this.rosterService.deleteRoster(this.currentRoster.id).subscribe({
      next: () => {
        this.loading = false;
        this.currentRoster = null;
        this.uniqueEmployeeIds = [];
        this.daysInMonth = [];
        this.successMessage = `Roster for ${monthName} ${year} removed successfully.`;
        this.loadAllRosters();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to remove roster.';
      }
    });
  }
}
