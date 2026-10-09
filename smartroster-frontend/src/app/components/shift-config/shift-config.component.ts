import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShiftConfigService } from '../../services/shift-config.service';
import { ShiftConfig } from '../../models/models';

@Component({
  selector: 'app-shift-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>⚙️ Shift Configuration</h1>
        <button class="btn btn-primary" (click)="openAddModal()">➕ Add Shift</button>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success">
        ✅ {{ successMessage }}
        <button class="btn btn-sm" style="margin-left:auto;background:none;color:inherit" (click)="successMessage=''">✕</button>
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger">
        ❌ {{ errorMessage }}
        <button class="btn btn-sm" style="margin-left:auto;background:none;color:inherit" (click)="errorMessage=''">✕</button>
      </div>

      <!-- Info -->
      <div class="alert alert-info mb-2">
        💡 Configure the number of employees needed for each shift on weekdays (Mon–Fri) and weekends (Sat–Sun).
      </div>

      <!-- Shift Cards -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <span>Loading shift configuration...</span>
      </div>

      <div class="shifts-container" *ngIf="!loading">
        <div *ngIf="shiftConfigs.length === 0" class="empty-state">
          <div class="icon">⚙️</div>
          <p>No shifts configured. Add a shift to get started.</p>
          <button class="btn btn-primary" (click)="openAddModal()">➕ Add Shift</button>
        </div>

        <div class="shift-grid">
          <div class="shift-card" *ngFor="let shift of shiftConfigs"
               [style.--shift-color]="shift.colorCode">
            <div class="shift-top">
              <div class="shift-color-bar" [style.background]="shift.colorCode"></div>
              <div class="shift-header">
                <h3>{{ shift.shiftName }}</h3>
                <div class="shift-actions">
                  <button class="btn btn-sm btn-secondary" (click)="openEditModal(shift)">✏️</button>
                  <button class="btn btn-sm btn-danger" (click)="confirmDelete(shift)">🗑️</button>
                </div>
              </div>
            </div>

            <div class="shift-body">
              <div class="staffing-row">
                <div class="staffing-item">
                  <div class="staffing-label">📅 Weekday</div>
                  <div class="staffing-value">{{ shift.weekdayCount }} <span class="text-muted">employees</span></div>
                </div>
                <div class="staffing-item">
                  <div class="staffing-label">🏖️ Weekend</div>
                  <div class="staffing-value">{{ shift.weekendCount }} <span class="text-muted">employees</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="card mt-3" *ngIf="shiftConfigs.length > 0">
          <h3 style="margin-bottom: 1rem;">📊 Staffing Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Weekday Total</div>
              <div class="summary-value">{{ getTotalWeekday() }} employees / day</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Weekend Total</div>
              <div class="summary-value">{{ getTotalWeekend() }} employees / day</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Minimum Employees Needed</div>
              <div class="summary-value">{{ getMinEmployees() }} (with weekly offs)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal" (click)="showModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom: 1.25rem;">
            {{ editingShift ? '✏️ Edit Shift' : '➕ New Shift' }}
          </h2>

          <div class="form-group">
            <label class="form-label">Shift Name</label>
            <input type="text" class="form-control" [(ngModel)]="formData.shiftName"
                   placeholder="e.g., Morning, Evening, Night">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Weekday Employees</label>
              <input type="number" class="form-control" [(ngModel)]="formData.weekdayCount" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Weekend Employees</label>
              <input type="number" class="form-control" [(ngModel)]="formData.weekendCount" min="0">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-picker-row">
              <input type="color" [(ngModel)]="formData.colorCode" class="color-input">
              <input type="text" class="form-control" [(ngModel)]="formData.colorCode" placeholder="#4CAF50">
            </div>
          </div>

          <div class="flex gap-1 mt-2" style="justify-content: flex-end;">
            <button class="btn btn-secondary" (click)="showModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="saveShift()" [disabled]="!formData.shiftName.trim()">
              {{ editingShift ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Modal -->
      <div class="modal-backdrop" *ngIf="deleteTarget" (click)="deleteTarget = null">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom: 1rem;">🗑️ Remove Shift</h2>
          <p>Are you sure you want to remove the <strong>{{ deleteTarget.shiftName }}</strong> shift?</p>
          <div class="flex gap-1 mt-2" style="justify-content: flex-end;">
            <button class="btn btn-secondary" (click)="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" (click)="deleteShift()">Remove</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shift-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.25rem;
    }

    .shift-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition-base);
    }

    .shift-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .shift-color-bar {
      height: 4px;
    }

    .shift-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem 0.5rem;
    }

    .shift-header h3 {
      margin: 0;
    }

    .shift-actions {
      display: flex;
      gap: 6px;
    }

    .shift-body {
      padding: 0 1.25rem 1.25rem;
    }

    .staffing-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .staffing-item {
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      padding: 0.75rem;
    }

    .staffing-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .staffing-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-heading);
    }

    .staffing-value .text-muted {
      font-size: 0.75rem;
      font-weight: 400;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-item {
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      padding: 1rem;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .summary-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-heading);
    }

    .color-picker-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .color-input {
      width: 44px;
      height: 38px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: none;
      padding: 2px;
    }
  `]
})
export class ShiftConfigComponent implements OnInit {
  shiftConfigs: ShiftConfig[] = [];
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
    colorCode: '#84A282'
  };

  constructor(private shiftConfigService: ShiftConfigService) {}

  ngOnInit() {
    this.loadShifts();
  }

  loadShifts() {
    this.loading = true;
    this.shiftConfigService.getShiftConfigs().subscribe({
      next: data => {
        this.shiftConfigs = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load shift configurations';
        this.loading = false;
      }
    });
  }

  openAddModal() {
    this.editingShift = null;
    this.formData = { shiftName: '', weekdayCount: 2, weekendCount: 1, colorCode: '#84A282' };
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
          this.successMessage = 'Shift updated successfully';
          this.showModal = false;
          this.loadShifts();
          this.autoClear();
        },
        error: err => this.errorMessage = err.error?.message || 'Failed to update shift'
      });
    } else {
      this.shiftConfigService.createShiftConfig(this.formData).subscribe({
        next: () => {
          this.successMessage = 'Shift created successfully';
          this.showModal = false;
          this.loadShifts();
          this.autoClear();
        },
        error: err => this.errorMessage = err.error?.message || 'Failed to create shift'
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
        this.successMessage = 'Shift removed';
        this.deleteTarget = null;
        this.loadShifts();
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

  getMinEmployees(): number {
    // Need at least max(weekday, weekend) + buffer for offs
    const max = Math.max(this.getTotalWeekday(), this.getTotalWeekend());
    return Math.ceil(max * 1.2); // 20% buffer for weekly offs
  }

  private autoClear() {
    setTimeout(() => this.successMessage = '', 4000);
  }
}
