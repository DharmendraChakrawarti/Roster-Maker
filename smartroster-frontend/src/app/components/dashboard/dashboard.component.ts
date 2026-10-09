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
        <h1>🏠 Dashboard</h1>
        <span class="text-muted">Welcome to SmartRoster</span>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card stat-employees">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-value">{{ employees.length }}</div>
            <div class="stat-label">Active Employees</div>
          </div>
        </div>
        <div class="stat-card stat-shifts">
          <div class="stat-icon">⚙️</div>
          <div class="stat-info">
            <div class="stat-value">{{ shiftConfigs.length }}</div>
            <div class="stat-label">Shift Types</div>
          </div>
        </div>
        <div class="stat-card stat-rosters">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ rosters.length }}</div>
            <div class="stat-label">Rosters Created</div>
          </div>
        </div>
        <div class="stat-card stat-staffing">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalWeekdayStaff }}</div>
            <div class="stat-label">Weekday Staff/Day</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <a routerLink="/employees" class="action-card">
            <div class="action-icon">👥</div>
            <div class="action-title">Manage Employees</div>
            <div class="action-desc">Add, edit, or import employee names</div>
          </a>
          <a routerLink="/shifts" class="action-card">
            <div class="action-icon">⚙️</div>
            <div class="action-title">Configure Shifts</div>
            <div class="action-desc">Set up shift types and staffing requirements</div>
          </a>
          <a routerLink="/roster" class="action-card">
            <div class="action-icon">📅</div>
            <div class="action-title">Generate Roster</div>
            <div class="action-desc">Create a new monthly shift roster</div>
          </a>
          <a routerLink="/roster" class="action-card action-export">
            <div class="action-icon">📥</div>
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
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    .stat-employees::before { background: linear-gradient(90deg, #84A282, #B8CFB3); }
    .stat-shifts::before { background: linear-gradient(90deg, #B8CFB3, #FEFAF3); }
    .stat-rosters::before { background: linear-gradient(90deg, #84A282, #F6E2E9); }
    .stat-staffing::before { background: linear-gradient(90deg, #F6E2E9, #84A282); }

    .stat-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      font-size: 2.2rem;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(132, 162, 130, 0.12);
      border-radius: var(--radius-md);
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-heading);
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 4px;
      font-weight: 500;
    }

    .section {
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 1px;
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
      position: relative;
      overflow: hidden;
    }

    .action-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(0, 180, 216, 0.05) 0%, transparent 60%);
      opacity: 0;
      transition: opacity var(--transition-base);
    }

    .action-card:hover {
      border-color: var(--accent-primary);
      transform: translateY(-3px);
      box-shadow: var(--shadow-glow);
    }

    .action-card:hover::after {
      opacity: 1;
    }

    .action-card.action-export:hover {
      border-color: var(--accent-success);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
    }

    .action-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    .action-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-heading);
      margin-bottom: 0.35rem;
    }

    .action-desc {
      font-size: 0.825rem;
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
      font-size: 0.85rem;
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
