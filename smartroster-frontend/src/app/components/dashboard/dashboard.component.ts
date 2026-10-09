import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { ShiftConfigService } from '../../services/shift-config.service';
import { RosterService } from '../../services/roster.service';
import { Employee, ShiftConfig, Roster } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Dashboard</h1>
        <span class="text-muted" style="font-size:0.85rem">Overview of your workforce and scheduling</span>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-icon-blue">
            <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ employees.length }}</div>
            <div class="stat-label">Active Employees</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-green">
            <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.05 1.41 1.16H21a2 2 0 0 1 0 4h-.09c-.64.11-1.15.56-1.41 1.16z"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ shiftConfigs.length }}</div>
            <div class="stat-label">Shift Types</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-purple">
            <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ rosters.length }}</div>
            <div class="stat-label">Rosters Created</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon stat-icon-amber">
            <svg class="icon-svg icon-lg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ totalWeekdayStaff }}</div>
            <div class="stat-label">Weekday Staff / Day</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <a routerLink="/employees" class="action-card">
            <div class="action-icon-wrap action-blue">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="action-title">Manage Employees</div>
            <div class="action-desc">Add, edit, or import employee names</div>
          </a>
          <a routerLink="/shifts" class="action-card">
            <div class="action-icon-wrap action-green">
              <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4c-.6.26-1.05.77-1.16 1.41V21a2 2 0 0 1-4 0v-.09c-.11-.64-.56-1.15-1.16-1.41a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15c-.6-.26-1.05-.77-1.16-1.41"/></svg>
            </div>
            <div class="action-title">Configure Shifts</div>
            <div class="action-desc">Set up shift types and staffing requirements</div>
          </a>
          <a routerLink="/roster" class="action-card">
            <div class="action-icon-wrap action-purple">
              <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="action-title">Generate Roster</div>
            <div class="action-desc">Create a new monthly shift roster</div>
          </a>
          <a routerLink="/roster" class="action-card">
            <div class="action-icon-wrap action-amber">
              <svg class="icon-svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div class="action-title">Export Excel</div>
            <div class="action-desc">Download roster as formatted .xlsx file</div>
          </a>
        </div>
      </div>

      <!-- Recent Rosters -->
      <div class="section" *ngIf="rosters.length > 0">
        <h2 class="section-title">Recent Rosters</h2>
        <div class="card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of rosters.slice(0, 5)">
                <td>{{ getMonthName(r.month) }}</td>
                <td>{{ r.year }}</td>
                <td>
                  <span class="badge" [class.badge-success]="r.status === 'FINALIZED'"
                        [class.badge-warning]="r.status === 'DRAFT'">
                    {{ r.status }}
                  </span>
                </td>
                <td>
                  <a routerLink="/roster" class="btn btn-sm btn-secondary">View</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Shift Config Summary -->
      <div class="section" *ngIf="shiftConfigs.length > 0">
        <h2 class="section-title">Current Shift Configuration</h2>
        <div class="shifts-grid">
          <div class="shift-card" *ngFor="let s of shiftConfigs"
               [style.border-left-color]="s.colorCode">
            <div class="shift-name">{{ s.shiftName }}</div>
            <div class="shift-detail">
              <span>Weekday: <strong>{{ s.weekdayCount }}</strong></span>
              <span>Weekend: <strong>{{ s.weekendCount }}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all var(--transition-base);
    }

    .stat-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
    }

    .stat-icon-blue { background: rgba(26, 115, 232, 0.12); color: #4da3ff; }
    .stat-icon-blue .icon-svg { stroke: #4da3ff; }
    .stat-icon-green { background: rgba(52, 168, 83, 0.12); color: #81c995; }
    .stat-icon-green .icon-svg { stroke: #81c995; }
    .stat-icon-purple { background: rgba(142, 68, 232, 0.12); color: #b388ff; }
    .stat-icon-purple .icon-svg { stroke: #b388ff; }
    .stat-icon-amber { background: rgba(249, 171, 0, 0.12); color: #f9ab00; }
    .stat-icon-amber .icon-svg { stroke: #f9ab00; }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-heading);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-top: 4px;
      font-weight: 500;
    }

    .section {
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-bottom: 1rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .action-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      text-decoration: none;
      transition: all var(--transition-base);
      cursor: pointer;
    }

    .action-card:hover {
      border-color: var(--accent-primary);
      transform: translateY(-3px);
      box-shadow: var(--shadow-glow);
    }

    .action-icon-wrap {
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      margin-bottom: 0.75rem;
    }

    .action-blue { background: rgba(26, 115, 232, 0.12); }
    .action-blue .icon-svg { stroke: #4da3ff; }
    .action-green { background: rgba(52, 168, 83, 0.12); }
    .action-green .icon-svg { stroke: #81c995; }
    .action-purple { background: rgba(142, 68, 232, 0.12); }
    .action-purple .icon-svg { stroke: #b388ff; }
    .action-amber { background: rgba(249, 171, 0, 0.12); }
    .action-amber .icon-svg { stroke: #f9ab00; }

    .action-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-heading);
      margin-bottom: 0.35rem;
    }

    .action-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .shifts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .shift-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-left: 4px solid;
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
    }

    .shift-name {
      font-weight: 700;
      color: var(--text-heading);
      margin-bottom: 0.5rem;
    }

    .shift-detail {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .shift-detail strong {
      color: var(--text-primary);
    }
  `]
})
export class DashboardComponent implements OnInit {
  employees: Employee[] = [];
  shiftConfigs: ShiftConfig[] = [];
  rosters: Roster[] = [];
  totalWeekdayStaff = 0;

  constructor(
    private employeeService: EmployeeService,
    private shiftConfigService: ShiftConfigService,
    private rosterService: RosterService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.employeeService.getEmployees().subscribe(data => this.employees = data);
    this.shiftConfigService.getShiftConfigs().subscribe(data => {
      this.shiftConfigs = data;
      this.totalWeekdayStaff = data.reduce((sum, s) => sum + s.weekdayCount, 0);
    });
    this.rosterService.getAllRosters().subscribe(data => this.rosters = data);
  }

  getMonthName(month: number): string {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || '';
  }
}
