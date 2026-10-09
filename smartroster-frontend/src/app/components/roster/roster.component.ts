import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RosterService } from '../../services/roster.service';
import { ShiftConfigService } from '../../services/shift-config.service';
import { EmployeeService } from '../../services/employee.service';
import {
  Roster,
  RosterAssignment,
  ShiftConfig,
  Employee,
  GenerateRosterRequest,
  AssignmentUpdate
} from '../../models/models';

interface DayColumn {
  dayNumber: number;
  dateStr: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isSunday: boolean;
  isSaturday: boolean;
}

interface ShiftSummaryItem {
  shiftName: string;
  colorCode: string;
  count: number;
}

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1><span>📅</span> Shift Roster Management</h1>
          <p class="text-muted">Generate, customize, and analyze monthly shift rosters with automated fairness</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" (click)="loadAllRosters()">
            <span>🔄</span> Refresh
          </button>
          <button *ngIf="currentRoster && currentRoster.id" class="btn btn-success" (click)="exportExcel()" [disabled]="loading">
            <span>📥</span> Export Excel
          </button>
          <button *ngIf="currentRoster && currentRoster.id && currentRoster.status !== 'FINALIZED'" class="btn btn-accent" (click)="finalizeCurrentRoster()" [disabled]="loading">
            <span>🔒</span> Finalize Roster
          </button>
          <button *ngIf="currentRoster && currentRoster.id" class="btn btn-danger" (click)="deleteCurrentRoster()" [disabled]="loading">
            <span>🗑️</span> Remove Roster
          </button>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success">
        <span>✓</span> {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger">
        <span>⚠️</span> {{ errorMessage }}
      </div>

      <!-- Generation / Controls Card -->
      <div class="card mb-3">
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

          <div class="control-group">
            <label class="control-label">Weekly Off Days</label>
            <select class="form-control select-control" [(ngModel)]="weeklyOffPerEmployee">
              <option [ngValue]="2">2 Days / Week</option>
              <option [ngValue]="1">1 Day / Week</option>
            </select>
          </div>

          <div class="control-group">
            <label class="control-label">Quick Actions</label>
            <div class="quick-btns">
              <button class="btn btn-primary" (click)="generateRoster()" [disabled]="loading">
                <span *ngIf="!loading">⚡ Generate Roster</span>
                <span *ngIf="loading">Generating...</span>
              </button>
              <button class="btn btn-secondary" (click)="loadRosterForMonth(selectedMonth, selectedYear)" [disabled]="loading">
                <span>🔍 Load Saved</span>
              </button>
            </div>
          </div>

          <!-- Existing Rosters Quick Select -->
          <div class="control-group saved-rosters" *ngIf="allRosters.length > 0">
            <label class="control-label">Saved Rosters ({{ allRosters.length }})</label>
            <div class="roster-pills">
              <button
                *ngFor="let r of allRosters"
                class="roster-pill"
                [class.active]="currentRoster && currentRoster.id === r.id"
                (click)="selectRoster(r)">
                {{ getMonthName(r.month) }} {{ r.year }}
                <span class="pill-badge" [class.badge-final]="r.status === 'FINALIZED'">
                  {{ r.status }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Warnings Banner if any -->
      <div *ngIf="currentRoster && currentRoster.warnings && currentRoster.warnings.length > 0" class="warnings-banner card mb-3">
        <div class="warning-title">
          <span>⚠️</span> <strong>Roster Rule Alerts ({{ currentRoster.warnings.length }}):</strong>
        </div>
        <ul class="warning-list">
          <li *ngFor="let w of currentRoster.warnings">{{ w }}</li>
        </ul>
      </div>

      <!-- Main Roster Area -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Processing roster algorithms...</p>
      </div>

      <div *ngIf="!loading && !currentRoster" class="empty-state card">
        <div class="icon">📅</div>
        <h3>No Roster Selected</h3>
        <p>Select a month/year above and click <strong>"Generate Roster"</strong> to create a balanced schedule, or load an existing one.</p>
        <button class="btn btn-primary" (click)="generateRoster()">
          <span>⚡ Generate for {{ getMonthName(selectedMonth) }} {{ selectedYear }}</span>
        </button>
      </div>

      <div *ngIf="!loading && currentRoster">
        <!-- View Mode Switcher & Stats Header -->
        <div class="view-toolbar card mb-2">
          <div class="view-tabs">
            <button class="tab-btn" [class.active]="activeTab === 'grid'" (click)="activeTab = 'grid'">
              <span>📊</span> Monthly Grid
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'analytics'" (click)="activeTab = 'analytics'">
              <span>📈</span> Fairness & Analytics
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'daily-coverage'" (click)="activeTab = 'daily-coverage'">
              <span>🛡️</span> Daily Coverage Check
            </button>
          </div>

          <div class="toolbar-info">
            <span class="status-indicator" [class.finalized]="currentRoster.status === 'FINALIZED'">
              Status: <strong>{{ currentRoster.status }}</strong>
            </span>
            <span class="stat-sep">•</span>
            <span>Total Employees: <strong>{{ uniqueEmployeeIds.length }}</strong></span>
            <span class="stat-sep">•</span>
            <span>Days: <strong>{{ daysInMonth.length }}</strong></span>
            <input
              type="text"
              class="form-control filter-input"
              placeholder="Filter employee..."
              [(ngModel)]="employeeFilter"
            />
          </div>
        </div>

        <!-- TAB 1: MONTHLY GRID -->
        <div *ngIf="activeTab === 'grid'" class="card grid-card">
          <!-- Shift Legend -->
          <div class="legend-bar">
            <span class="legend-title">Shift Legend:</span>
            <div class="legend-items">
              <div *ngFor="let s of shifts" class="legend-item">
                <span class="legend-badge" [style.background-color]="s.colorCode || '#00b4d8'">
                  {{ getShiftAbbreviation(s.shiftName) }}
                </span>
                <span>{{ s.shiftName }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-badge badge-off">OFF</span>
                <span>Weekly Off</span>
              </div>
            </div>
            <div class="legend-tip">
              💡 <em>Click any cell to edit shift or mark OFF</em>
            </div>
          </div>

          <!-- The Calendar Matrix Table -->
          <div class="matrix-wrapper">
            <table class="roster-matrix">
              <thead>
                <tr>
                  <th class="col-emp-header sticky-col">Employee</th>
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
                <tr *ngFor="let empId of filteredEmployeeIds; let i = index">
                  <td class="sticky-col emp-name-cell">
                    <div class="emp-name-wrapper">
                      <span class="emp-avatar">{{ getEmployeeName(empId).charAt(0) }}</span>
                      <span class="emp-name">{{ getEmployeeName(empId) }}</span>
                    </div>
                  </td>
                  <td
                    *ngFor="let day of daysInMonth"
                    class="shift-cell"
                    [class.cell-weekend]="day.isWeekend"
                    (click)="openEditModal(empId, day.dateStr)">
                    <div
                      class="shift-tag"
                      [style.background-color]="getShiftColor(empId, day.dateStr)"
                      [class.tag-off]="isOffDay(empId, day.dateStr)"
                      [class.tag-manual]="isManualEdit(empId, day.dateStr)">
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
                    <span class="dot" [style.background-color]="s.colorCode || '#00b4d8'"></span>
                    {{ s.shiftName }} Staff
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
                    {{ getTotalMonthlyShiftCount(s.shiftName) }}
                  </td>
                </tr>
                <tr class="coverage-row off-row">
                  <td class="sticky-col coverage-label">
                    <span class="dot off-dot"></span> Total OFF
                  </td>
                  <td *ngFor="let day of daysInMonth" class="coverage-cell">
                    {{ getDailyOffStaffCount(day.dateStr) }}
                  </td>
                  <td colspan="2"></td>
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
                <h3>⚖️ Shift Distribution Fairness</h3>
                <span class="badge badge-success">Optimized</span>
              </div>
              <p class="text-muted mb-2">
                SmartRoster algorithms ensure fair distribution of Night shifts, Weekday shifts, and Weekend work across all team members.
              </p>
              <div class="fairness-stats-grid">
                <div class="f-stat">
                  <div class="f-val">{{ getAverageShiftsPerEmployee() }}</div>
                  <div class="f-lbl">Avg Shifts / Person</div>
                </div>
                <div class="f-stat">
                  <div class="f-val">{{ getAverageOffsPerEmployee() }}</div>
                  <div class="f-lbl">Avg OFFs / Person</div>
                </div>
                <div class="f-stat">
                  <div class="f-val">{{ getTotalMonthlyAssignments() }}</div>
                  <div class="f-lbl">Total Shift Slots</div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>📊 Shift Type Breakdown</h3>
              </div>
              <div class="shift-breakdown-list">
                <div *ngFor="let s of shifts" class="breakdown-item">
                  <div class="b-header">
                    <span class="b-name">
                      <span class="dot" [style.background-color]="s.colorCode"></span>
                      {{ s.shiftName }}
                    </span>
                    <span class="b-count">{{ getTotalMonthlyShiftCount(s.shiftName) }} slots</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      [style.background-color]="s.colorCode || '#00b4d8'"
                      [style.width.%]="getShiftPercentage(s.shiftName)">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Employee Breakdown Table -->
          <div class="card">
            <div class="card-header">
              <h3>👥 Per-Employee Workload Breakdown</h3>
              <button class="btn btn-sm btn-secondary" (click)="exportExcel()">Export Report</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th *ngFor="let s of shifts">{{ s.shiftName }}</th>
                  <th>Weekly OFFs</th>
                  <th>Total Shifts</th>
                  <th>Fairness Index</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let empId of uniqueEmployeeIds">
                  <td>
                    <strong>{{ getEmployeeName(empId) }}</strong>
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
                    <span class="badge badge-success">✓ Balanced</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB 3: DAILY COVERAGE CHECK -->
        <div *ngIf="activeTab === 'daily-coverage'" class="card">
          <div class="card-header">
            <h3>🛡️ Daily Staffing Requirements vs Actual Coverage</h3>
          </div>
          <p class="text-muted mb-2">Detailed daily breakdown verifying whether weekday and weekend minimum requirements are satisfied.</p>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Type</th>
                  <th *ngFor="let s of shifts">{{ s.shiftName }} (Req / Act)</th>
                  <th>OFF Count</th>
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
                      {{ isAllStaffingMetForDay(day) ? '✓ Optimal' : '⚠️ Deficit' }}
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
            <h3>Edit Shift Assignment</h3>
            <button class="close-btn" (click)="closeEditModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="modal-emp-info">
              <div><strong>Employee:</strong> {{ editEmployeeName }}</div>
              <div><strong>Date:</strong> {{ editDate }}</div>
            </div>

            <div class="form-group mt-2">
              <label class="form-label">Select Shift or Off</label>
              <div class="shift-radio-group">
                <label
                  *ngFor="let s of shifts"
                  class="shift-radio-card"
                  [class.selected]="editSelectedShift === s.shiftName"
                  (click)="selectModalShift(s.shiftName, false)">
                  <span class="dot" [style.background-color]="s.colorCode || '#00b4d8'"></span>
                  <div class="radio-label">
                    <strong>{{ s.shiftName }}</strong>
                    <small>Req: {{ s.weekdayCount }} (Wkday) / {{ s.weekendCount }} (Wkend)</small>
                  </div>
                </label>

                <label
                  class="shift-radio-card"
                  [class.selected]="editIsWeeklyOff"
                  (click)="selectModalShift(null, true)">
                  <span class="dot off-dot"></span>
                  <div class="radio-label">
                    <strong>Weekly OFF</strong>
                    <small>Scheduled Rest Day</small>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeEditModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveAssignmentEdit()" [disabled]="loading">
              Save Change
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .roster-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      align-items: flex-end;
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .control-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .select-control {
      min-width: 140px;
    }

    .quick-btns {
      display: flex;
      gap: 8px;
    }

    .saved-rosters {
      flex: 1;
      min-width: 250px;
    }

    .roster-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 80px;
      overflow-y: auto;
    }

    .roster-pill {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
    }

    .roster-pill:hover {
      border-color: var(--accent-primary);
      background: var(--bg-card-hover);
    }

    .roster-pill.active {
      border-color: #84A282;
      background: rgba(132, 162, 130, 0.2);
      color: #FEFAF3;
      font-weight: 600;
    }

    .pill-badge {
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 10px;
      background: rgba(227, 184, 116, 0.2);
      color: var(--accent-warning);
    }

    .pill-badge.badge-final {
      background: rgba(132, 162, 130, 0.25);
      color: #FEFAF3;
      border: 1px solid rgba(132, 162, 130, 0.4);
    }

    /* Warnings Banner */
    .warnings-banner {
      background: rgba(227, 184, 116, 0.08);
      border-color: rgba(227, 184, 116, 0.3);
      padding: 1rem 1.5rem;
    }

    .warning-title {
      color: var(--accent-warning);
      margin-bottom: 0.5rem;
    }

    .warning-list {
      margin: 0;
      padding-left: 1.5rem;
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .warning-list li {
      margin-bottom: 4px;
    }

    /* View Toolbar */
    .view-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 1.5rem;
    }

    .view-tabs {
      display: flex;
      gap: 6px;
    }

    .tab-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all var(--transition-fast);
    }

    .tab-btn:hover {
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, #84A282 0%, #638361 100%);
      color: #FEFAF3;
      border-color: #84A282;
      box-shadow: 0 2px 8px rgba(132, 162, 130, 0.3);
    }

    .toolbar-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .stat-sep {
      color: var(--border-color);
    }

    .filter-input {
      width: 160px;
      padding: 6px 10px;
      font-size: 0.8rem;
    }

    .status-indicator {
      padding: 4px 10px;
      border-radius: 20px;
      background: rgba(227, 184, 116, 0.15);
      color: var(--accent-warning);
    }

    .status-indicator.finalized {
      background: rgba(132, 162, 130, 0.2);
      color: #FEFAF3;
      border: 1px solid rgba(132, 162, 130, 0.4);
    }

    /* Legend */
    .legend-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .legend-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
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
      height: 24px;
      padding: 0 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #fff;
      font-size: 0.7rem;
    }

    .legend-badge.badge-off {
      background: #F6E2E9;
      color: #5a2636;
      width: auto;
      padding: 0 8px;
      font-weight: 800;
      border: 1px solid #e5b3c2;
    }

    .legend-tip {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Matrix Table */
    .grid-card {
      padding: 1.5rem;
      overflow: hidden;
    }

    .matrix-wrapper {
      max-width: 100%;
      overflow-x: auto;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-secondary);
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
      min-width: 40px;
    }

    .sticky-col {
      position: sticky;
      left: 0;
      background: var(--bg-card);
      z-index: 10;
      min-width: 170px !important;
      text-align: left !important;
      padding-left: 12px !important;
      border-right: 2px solid var(--border-hover) !important;
    }

    .col-emp-header {
      background: var(--bg-card) !important;
      font-weight: 700;
      color: var(--text-heading);
    }

    .col-day-header {
      background: var(--bg-card);
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
      background: rgba(246, 226, 233, 0.08) !important;
      border-bottom: 2px solid rgba(246, 226, 233, 0.3) !important;
    }

    .col-sunday {
      background: rgba(246, 226, 233, 0.12) !important;
      border-bottom: 2px solid #F6E2E9 !important;
    }

    .col-summary-header {
      background: var(--bg-card);
      min-width: 55px !important;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .emp-name-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .emp-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #84A282 0%, #B8CFB3 100%);
      color: #121915;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.7rem;
    }

    .emp-name {
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    .shift-cell {
      cursor: pointer;
      transition: background var(--transition-fast);
      padding: 4px 2px !important;
    }

    .shift-cell:hover {
      background: rgba(132, 162, 130, 0.2) !important;
    }

    .cell-weekend {
      background: rgba(246, 226, 233, 0.03);
    }

    .shift-tag {
      display: inline-block;
      width: 36px;
      height: 28px;
      line-height: 28px;
      border-radius: 4px;
      font-weight: 700;
      color: #fff;
      font-size: 0.7rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      transition: transform var(--transition-fast);
    }

    .shift-tag:hover {
      transform: scale(1.1);
    }

    .tag-off {
      background: #F6E2E9 !important;
      color: #5a2636 !important;
      font-weight: 800;
      border: 1px solid #e5b3c2;
      box-shadow: 0 1px 3px rgba(246, 226, 233, 0.25);
    }

    .tag-manual {
      box-shadow: 0 0 0 2px var(--accent-warning);
    }

    .col-summary-val {
      font-weight: 700;
      font-size: 0.85rem;
    }

    .count-shifts {
      color: var(--palette-sage-light);
      background: rgba(184, 207, 179, 0.08);
    }

    .count-off {
      color: var(--palette-blush);
      background: rgba(246, 226, 233, 0.1);
      font-weight: 800;
    }

    /* Footer Coverage Rows */
    .coverage-row td {
      font-weight: 600;
      font-size: 0.75rem;
      background: var(--bg-card);
    }

    .coverage-label {
      font-size: 0.75rem !important;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .off-dot {
      background: #F6E2E9;
    }

    .coverage-cell {
      padding: 6px 2px !important;
    }

    .coverage-met {
      color: var(--palette-sage-light);
    }

    .coverage-deficit {
      color: var(--accent-danger-light);
      background: rgba(226, 125, 142, 0.15) !important;
      font-weight: 800;
    }

    .req-small {
      font-size: 0.65rem;
      opacity: 0.7;
    }

    .coverage-total {
      font-weight: 700;
      color: var(--palette-cream);
    }

    /* Analytics Tab */
    .grid-2-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .fairness-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }

    .f-stat {
      background: var(--bg-primary);
      padding: 1.25rem;
      border-radius: var(--radius-md);
      text-align: center;
      border: 1px solid var(--border-color);
    }

    .f-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--palette-sage-light);
    }

    .f-lbl {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
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
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    .modal-emp-info {
      background: var(--bg-primary);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
    }

    .shift-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }

    .shift-radio-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .shift-radio-card:hover {
      border-color: var(--border-hover);
    }

    .shift-radio-card.selected {
      border-color: var(--accent-primary);
      background: rgba(132, 162, 130, 0.15);
    }

    .radio-label {
      display: flex;
      flex-direction: column;
    }

    .radio-label small {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .modal-footer {
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
  `]
})
export class RosterComponent implements OnInit {
  currentRoster: Roster | null = null;
  allRosters: Roster[] = [];
  shifts: ShiftConfig[] = [];
  employees: Employee[] = [];

  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  weeklyOffPerEmployee: number = 2;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  years: number[] = [];

  activeTab: 'grid' | 'analytics' | 'daily-coverage' = 'grid';
  employeeFilter: string = '';

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
    private employeeService: EmployeeService
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 3; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
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

  loadAllRosters(): void {
    this.rosterService.getAllRosters().subscribe({
      next: (rosters) => {
        this.allRosters = rosters;
        // If current month roster exists, select it
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

  onMonthYearChange(): void {
    this.computeDaysInMonth();
    this.loadRosterForMonth(this.selectedMonth, this.selectedYear);
  }

  loadRosterForMonth(month: number, year: number): void {
    this.loading = true;
    this.clearMessages();
    this.rosterService.getRosterByMonth(month, year).subscribe({
      next: (roster) => {
        this.loading = false;
        if (roster && roster.assignments && roster.assignments.length > 0) {
          this.setCurrentRoster(roster);
        } else {
          this.currentRoster = null;
        }
      },
      error: (err) => {
        this.loading = false;
        this.currentRoster = null;
      }
    });
  }

  generateRoster(): void {
    this.clearMessages();

    // Check if roster already exists for selected month/year
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
      weeklyOffPerEmployee: this.weeklyOffPerEmployee
    };

    this.rosterService.generateRoster(request).subscribe({
      next: (roster) => {
        this.loading = false;
        this.setCurrentRoster(roster);
        this.successMessage = `Roster for ${this.getMonthName(this.selectedMonth)} ${this.selectedYear} generated successfully!`;
        this.loadAllRosters();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || err.message || 'Failed to generate roster. Please check employee and shift configurations.';
      }
    });
  }

  selectRoster(r: Roster): void {
    this.selectedMonth = r.month;
    this.selectedYear = r.year;
    this.weeklyOffPerEmployee = r.weeklyOffPerEmployee || 2;
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
    // Return first 2 characters uppercased (e.g., "Morning" -> "MO", "Evening" -> "EV", "Night" -> "NI")
    return shiftName.substring(0, 2).toUpperCase();
  }

  getShiftColor(employeeId: number, dateStr: string): string {
    const a = this.getAssignment(employeeId, dateStr);
    if (!a || a.isWeeklyOff || !a.shiftName) return '#253342';

    const shift = this.shifts.find(
      (s) => s.shiftName.toLowerCase() === a.shiftName?.toLowerCase()
    );
    return shift?.colorCode || '#84A282';
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

  // Daily Staffing helpers
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
    return this.currentRoster.assignments.filter((a) => !a.isWeeklyOff && a.shiftName)
      .length;
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

  // Modal Actions
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
          this.successMessage = `Updated assignment for ${this.editEmployeeName} on ${this.editDate}`;
        },
        error: (err) => {
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
      error: (err) => {
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
        this.successMessage = 'Excel spreadsheet downloaded successfully!';
      },
      error: (err) => {
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
        this.successMessage = `Roster for ${monthName} ${year} has been removed.`;
        this.loadAllRosters();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to remove roster.';
      }
    });
  }
}
