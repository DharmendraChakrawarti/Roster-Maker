import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftConfigService } from '../../services/shift-config.service';
import { EmployeeService } from '../../services/employee.service';
import { ShiftConfig, Employee } from '../../models/models';

@Component({
  selector: 'app-shift-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Shift Configuration</h1>
          <p class="text-secondary subtitle">Define operational shifts, daily staffing quotas, and workforce capacity balancing</p>
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Shift
        </button>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>{{ successMessage }}</span>
        <button class="alert-close-btn" (click)="successMessage=''">✕</button>
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>{{ errorMessage }}</span>
        <button class="alert-close-btn" (click)="errorMessage=''">✕</button>
      </div>

      <!-- Live Staffing Capacity & Quota Calculator Card -->
      <div class="card mb-3 calculator-card">
        <div class="calc-header">
          <div class="calc-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>
            <span>Staffing Capacity &amp; Quota Calculator</span>
          </div>
          <span class="badge" [class.badge-success]="getCapacityStatus() === 'OPTIMAL'"
                               [class.badge-warning]="getCapacityStatus() === 'OVERSTAFFED'"
                               [class.badge-danger]="getCapacityStatus() === 'DEFICIT'">
            {{ getCapacityStatusText() }}
          </span>
        </div>

        <p class="text-secondary calc-description">
          Based on <strong>{{ activeEmployeeCount }} active employees</strong> working 5 days/week (2 weekly rest days), here is your mathematical capacity vs current shift quotas:
        </p>

        <div class="calc-metrics-grid">
          <div class="calc-metric">
            <span class="calc-lbl">Active Workforce</span>
            <span class="calc-val">{{ activeEmployeeCount }} <small class="text-muted">staff</small></span>
            <span class="calc-sub">Available personnel</span>
          </div>
          <div class="calc-metric">
            <span class="calc-lbl">Weekly Shift Supply</span>
            <span class="calc-val">{{ getWeeklySupply() }} <small class="text-muted">slots/wk</small></span>
            <span class="calc-sub">{{ activeEmployeeCount }} × 5 work days</span>
          </div>
          <div class="calc-metric">
            <span class="calc-lbl">Current Config Demand</span>
            <span class="calc-val">{{ getWeeklyDemand() }} <small class="text-muted">slots/wk</small></span>
            <span class="calc-sub">(5 × {{ getTotalWeekday() }}) + (2 × {{ getTotalWeekend() }})</span>
          </div>
          <div class="calc-metric highlight-metric">
            <span class="calc-lbl">Capacity Utilization</span>
            <span class="calc-val" [class.text-warning]="getCapacityStatus() === 'OVERSTAFFED'"
                                   [class.text-danger]="getCapacityStatus() === 'DEFICIT'"
                                   [class.text-success]="getCapacityStatus() === 'OPTIMAL'">
              {{ getUtilizationPercent() }}%
            </span>
            <span class="calc-sub">Target: 95% – 105%</span>
          </div>
        </div>

        <div class="calc-advice" [class.advice-warning]="getCapacityStatus() === 'OVERSTAFFED'"
                                 [class.advice-danger]="getCapacityStatus() === 'DEFICIT'"
                                 [class.advice-success]="getCapacityStatus() === 'OPTIMAL'">
          <div class="advice-content">
            <strong *ngIf="getCapacityStatus() === 'OVERSTAFFED'">Workforce Capacity Exceeds Configured Demand:</strong>
            <strong *ngIf="getCapacityStatus() === 'DEFICIT'">Shift Demand Exceeds Workforce Capacity:</strong>
            <strong *ngIf="getCapacityStatus() === 'OPTIMAL'">Perfect Mathematical Equilibrium:</strong>
            <p>{{ getCapacityAdvice() }}</p>
          </div>
          <div class="recommended-box" *ngIf="getCapacityStatus() !== 'OPTIMAL'">
            <div class="rec-title">Recommended Shift Quotas for {{ activeEmployeeCount }} Employees:</div>
            <div class="rec-values">
              <span>Weekday: <strong>{{ getRecommendedWeekdayTotal() }} / day</strong> ({{ getRecommendedWeekdayPerShift() }} / shift)</span>
              <span>•</span>
              <span>Weekend: <strong>{{ getRecommendedWeekendTotal() }} / day</strong> ({{ getRecommendedWeekendPerShift() }} / shift)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading shift configuration...</span>
      </div>

      <!-- Shifts Container -->
      <div class="shifts-container" *ngIf="!loading">
        <div *ngIf="shiftConfigs.length === 0" class="empty-state">
          <div class="empty-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <p>No shift types found in configuration.</p>
          <button class="btn btn-primary" (click)="openAddModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add First Shift
          </button>
        </div>

        <div class="shift-grid" *ngIf="shiftConfigs.length > 0">
          <div class="shift-card" *ngFor="let shift of shiftConfigs">
            <div class="shift-color-indicator" [style.background]="shift.colorCode || 'var(--accent-primary)'"></div>
            
            <div class="shift-header">
              <div class="shift-title-row">
                <span class="shift-badge-dot" [style.background]="shift.colorCode || 'var(--accent-primary)'"></span>
                <h3>{{ shift.shiftName }}</h3>
              </div>
              <div class="shift-actions">
                <button class="icon-btn edit-btn" (click)="openEditModal(shift)" title="Edit Shift">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="icon-btn delete-btn" (click)="confirmDelete(shift)" title="Delete Shift">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>

            <div class="shift-body">
              <div class="staffing-row">
                <div class="staffing-item">
                  <div class="staffing-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Weekday Quota
                  </div>
                  <div class="staffing-value">{{ shift.weekdayCount }} <span class="text-muted">staff/day</span></div>
                </div>
                <div class="staffing-item">
                  <div class="staffing-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    Weekend Quota
                  </div>
                  <div class="staffing-value">{{ shift.weekendCount }} <span class="text-muted">staff/day</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingShift ? 'Edit Shift Configuration' : 'Create New Shift' }}</h3>
            <button class="modal-close" (click)="showModal = false">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Shift Name</label>
            <input type="text" class="form-control" [(ngModel)]="formData.shiftName"
                   placeholder="e.g., Morning, Evening, Night">
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Weekday Staff Quota</label>
              <input type="number" class="form-control" [(ngModel)]="formData.weekdayCount" min="0">
              <small class="form-hint">Personnel required Mon–Fri</small>
            </div>
            <div class="form-group">
              <label class="form-label">Weekend Staff Quota</label>
              <input type="number" class="form-control" [(ngModel)]="formData.weekendCount" min="0">
              <small class="form-hint">Personnel required Sat–Sun</small>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Color Identifier</label>
            <div class="color-picker-row">
              <input type="color" [(ngModel)]="formData.colorCode" class="color-input">
              <input type="text" class="form-control hex-control" [(ngModel)]="formData.colorCode" placeholder="#1a73e8">
              <div class="color-preview" [style.background]="formData.colorCode">
                Preview Badge
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveShift()" [disabled]="!formData.shiftName.trim()">
              {{ editingShift ? 'Save Changes' : 'Create Shift' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-backdrop" *ngIf="deleteTarget" (click)="deleteTarget = null">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Confirm Shift Removal</h3>
            <button class="modal-close" (click)="deleteTarget = null">✕</button>
          </div>
          <p class="modal-text">
            Are you sure you want to remove the <strong>{{ deleteTarget.shiftName }}</strong> shift configuration? Existing rosters referencing this shift will retain their historical assignments.
          </p>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" (click)="deleteShift()">Confirm Remove</button>
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

    /* Calculator Card */
    .calculator-card {
      padding: 1.5rem;
      border: 1px solid var(--border-color);
      background: linear-gradient(135deg, rgba(28, 29, 36, 0.95) 0%, rgba(20, 21, 28, 0.95) 100%);
    }

    .calc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .calc-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-heading);
    }

    .calc-description {
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 1.25rem;
    }

    .calc-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .calc-metric {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
    }

    .highlight-metric {
      border-color: rgba(26, 115, 232, 0.35);
      background: rgba(26, 115, 232, 0.08);
    }

    .calc-lbl {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }

    .calc-val {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-heading);
      line-height: 1.2;
    }

    .calc-val small {
      font-size: 0.8rem;
      font-weight: 500;
    }

    .calc-sub {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .calc-advice {
      border-radius: var(--radius-md);
      padding: 1rem 1.25rem;
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .advice-warning {
      background: rgba(249, 171, 0, 0.08);
      border-color: rgba(249, 171, 0, 0.3);
    }

    .advice-danger {
      background: rgba(234, 67, 53, 0.08);
      border-color: rgba(234, 67, 53, 0.3);
    }

    .advice-success {
      background: rgba(52, 168, 83, 0.08);
      border-color: rgba(52, 168, 83, 0.3);
    }

    .advice-content strong {
      display: block;
      margin-bottom: 4px;
      font-size: 0.9rem;
    }

    .advice-content p {
      font-size: 0.85rem;
      line-height: 1.5;
      margin: 0;
      color: var(--text-secondary);
    }

    .recommended-box {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 0.75rem;
    }

    .rec-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: var(--accent-primary-light);
      margin-bottom: 4px;
    }

    .rec-values {
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      color: var(--text-heading);
    }

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

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      font-size: 0.95rem;
    }

    .shift-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .shift-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition-base);
      display: flex;
      flex-direction: column;
    }

    .shift-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .shift-color-indicator {
      height: 4px;
      width: 100%;
    }

    .shift-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.25rem 0.75rem;
    }

    .shift-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .shift-badge-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .shift-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-heading);
      margin: 0;
    }

    .shift-actions {
      display: flex;
      gap: 6px;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .icon-btn:hover {
      background: var(--bg-card-hover);
      color: var(--text-primary);
      border-color: var(--border-hover);
    }

    .edit-btn:hover {
      color: var(--accent-primary-light);
      border-color: var(--accent-primary);
    }

    .delete-btn:hover {
      color: var(--accent-danger-light);
      border-color: var(--accent-danger);
    }

    .shift-body {
      padding: 0 1.25rem 1.25rem;
      margin-top: auto;
    }

    .staffing-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .staffing-item {
      background: var(--bg-secondary);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: var(--radius-sm);
      padding: 0.85rem;
    }

    .staffing-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .staffing-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-heading);
    }

    .staffing-value .text-muted {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--text-muted);
    }

    /* Modal Styling */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h3 {
      font-size: 1.2rem;
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-hint {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .color-picker-row {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .color-input {
      width: 44px;
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: var(--bg-input);
      padding: 2px;
    }

    .hex-control {
      max-width: 140px;
      font-family: monospace;
      font-size: 0.85rem;
    }

    .color-preview {
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      text-shadow: 0 1px 2px rgba(0,0,0,0.6);
    }

    .modal-text {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class ShiftConfigComponent implements OnInit {
  shiftConfigs: ShiftConfig[] = [];
  employees: Employee[] = [];
  activeEmployeeCount: number = 0;
  loading = true;
  showModal = false;
  editingShift: ShiftConfig | null = null;
  deleteTarget: ShiftConfig | null = null;
  successMessage = '';
  errorMessage = '';

  formData: ShiftConfig = {
    shiftName: '',
    weekdayCount: 2,
    weekendCount: 1,
    colorCode: '#1a73e8'
  };

  constructor(
    private shiftConfigService: ShiftConfigService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.shiftConfigService.getShiftConfigs().subscribe({
      next: data => {
        this.shiftConfigs = data;
        this.loadEmployees();
      },
      error: () => {
        this.errorMessage = 'Failed to load shift configurations';
        this.loading = false;
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: emps => {
        this.employees = emps;
        this.activeEmployeeCount = emps.filter(e => e.active !== false).length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.editingShift = null;
    this.formData = { shiftName: '', weekdayCount: 2, weekendCount: 1, colorCode: '#1a73e8' };
    this.showModal = true;
  }

  openEditModal(shift: ShiftConfig) {
    this.editingShift = shift;
    this.formData = { ...shift };
    this.showModal = true;
  }

  saveShift() {
    if (!this.formData.shiftName?.trim()) return;

    if (this.editingShift) {
      this.shiftConfigService.updateShiftConfig(this.editingShift.id!, this.formData).subscribe({
        next: () => {
          this.successMessage = 'Shift configuration updated successfully';
          this.showModal = false;
          this.loadData();
          this.autoClear();
        },
        error: err => (this.errorMessage = err.error?.message || 'Failed to update shift')
      });
    } else {
      this.shiftConfigService.createShiftConfig(this.formData).subscribe({
        next: () => {
          this.successMessage = 'Shift configuration created successfully';
          this.showModal = false;
          this.loadData();
          this.autoClear();
        },
        error: err => (this.errorMessage = err.error?.message || 'Failed to create shift')
      });
    }
  }

  confirmDelete(shift: ShiftConfig) {
    this.deleteTarget = shift;
  }

  deleteShift() {
    if (!this.deleteTarget) return;
    this.shiftConfigService.deleteShiftConfig(this.deleteTarget.id!).subscribe({
      next: () => {
        this.successMessage = 'Shift removed successfully';
        this.deleteTarget = null;
        this.loadData();
        this.autoClear();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to remove shift';
        this.deleteTarget = null;
      }
    });
  }

  getTotalWeekday(): number {
    return this.shiftConfigs.reduce((sum, s) => sum + s.weekdayCount, 0);
  }

  getTotalWeekend(): number {
    return this.shiftConfigs.reduce((sum, s) => sum + s.weekendCount, 0);
  }

  // Capacity Calculator Helpers
  getWeeklySupply(): number {
    // Each employee works 5 days per week (2 weekly rest days)
    return this.activeEmployeeCount * 5;
  }

  getWeeklyDemand(): number {
    // 5 weekdays + 2 weekend days
    return (5 * this.getTotalWeekday()) + (2 * this.getTotalWeekend());
  }

  getUtilizationPercent(): number {
    const supply = this.getWeeklySupply();
    if (supply === 0) return 0;
    return Math.round((this.getWeeklyDemand() / supply) * 100);
  }

  getCapacityStatus(): 'OPTIMAL' | 'OVERSTAFFED' | 'DEFICIT' {
    const pct = this.getUtilizationPercent();
    if (pct >= 90 && pct <= 110) return 'OPTIMAL';
    if (pct < 90) return 'OVERSTAFFED';
    return 'DEFICIT';
  }

  getCapacityStatusText(): string {
    const s = this.getCapacityStatus();
    if (s === 'OPTIMAL') return 'Optimal 100% Balanced';
    if (s === 'OVERSTAFFED') return 'Capacity Surplus (Overstaffed)';
    return 'Staffing Deficit (Understaffed)';
  }

  getCapacityAdvice(): string {
    const s = this.getCapacityStatus();
    if (s === 'OPTIMAL') {
      return `Your shift requirements (${this.getWeeklyDemand()} slots/wk) match your team capacity (${this.getWeeklySupply()} slots/wk) with precision. Every employee will work 5 days/week with 2 rest days.`;
    }
    if (s === 'OVERSTAFFED') {
      const extra = this.getWeeklySupply() - this.getWeeklyDemand();
      return `Your ${this.activeEmployeeCount} employees generate ${this.getWeeklySupply()} working shifts/week, but your configured shifts only demand ${this.getWeeklyDemand()} shifts/week (${extra} surplus shifts/wk). To utilize your full team, increase your shift quotas to the recommended values below. In strict mode, extra capacity is shared as rotational rest.`;
    }
    const needed = this.getWeeklyDemand() - this.getWeeklySupply();
    return `Your configured shift quotas demand ${this.getWeeklyDemand()} shifts/week, but your team can only safely provide ${this.getWeeklySupply()} shifts/week (${needed} slots shortage). Reduce quotas or add more employees to prevent burnout.`;
  }

  getRecommendedWeekdayTotal(): number {
    // 5 weekdays need ~75% of weekly capacity
    const supply = this.getWeeklySupply();
    return Math.round((supply * 0.77) / 5);
  }

  getRecommendedWeekendTotal(): number {
    // 2 weekend days need ~23% of weekly capacity
    const supply = this.getWeeklySupply();
    return Math.round((supply * 0.23) / 2);
  }

  getRecommendedWeekdayPerShift(): number {
    const count = this.shiftConfigs.length || 3;
    return Math.round(this.getRecommendedWeekdayTotal() / count);
  }

  getRecommendedWeekendPerShift(): number {
    const count = this.shiftConfigs.length || 3;
    return Math.round(this.getRecommendedWeekendTotal() / count);
  }

  private autoClear() {
    setTimeout(() => (this.successMessage = ''), 4000);
  }
}
