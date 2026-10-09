import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { Employee } from '../../models/models';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Manage Employees</h1>
        <div class="page-actions">
          <button class="btn btn-secondary" (click)="showImportModal = true">Import File</button>
          <button class="btn btn-primary" (click)="showBulkModal = true">Add Employees</button>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
        <button class="btn btn-sm" style="margin-left:auto; background:none; color:inherit; text-transform:none" (click)="successMessage = ''">Dismiss</button>
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
        <button class="btn btn-sm" style="margin-left:auto; background:none; color:inherit; text-transform:none" (click)="errorMessage = ''">Dismiss</button>
      </div>

      <!-- Employee List -->
      <div class="card">
        <div class="card-header">
          <h3>Active Employees ({{ employees.length }})</h3>
          <div class="flex gap-1 items-center">
            <input type="text" class="form-control search-input" placeholder="Search employees..."
                   [(ngModel)]="searchTerm" (input)="filterEmployees()">
          </div>
        </div>

        <div *ngIf="loading" class="loading-overlay">
          <div class="spinner"></div>
          <span>Loading employees...</span>
        </div>

        <div *ngIf="!loading && filteredEmployees.length === 0" class="empty-state">
          <div class="icon">
            <svg class="icon-svg icon-xl" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <p>No employees found. Add employees to get started.</p>
          <button class="btn btn-primary" (click)="showBulkModal = true">Add Employees</button>
        </div>

        <table class="data-table" *ngIf="!loading && filteredEmployees.length > 0">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of filteredEmployees; let i = index">
              <td class="text-muted">{{ i + 1 }}</td>
              <td>
                <span *ngIf="editingId !== emp.id">{{ emp.name }}</span>
                <input *ngIf="editingId === emp.id" type="text" class="form-control"
                       [(ngModel)]="editName" (keyup.enter)="saveEdit(emp)"
                       (keyup.escape)="cancelEdit()">
              </td>
              <td>
                <span class="badge badge-success">Active</span>
              </td>
              <td>
                <div class="flex gap-1">
                  <button *ngIf="editingId !== emp.id" class="btn btn-sm btn-secondary"
                          (click)="startEdit(emp)">Edit</button>
                  <button *ngIf="editingId === emp.id" class="btn btn-sm btn-success"
                          (click)="saveEdit(emp)">Save</button>
                  <button *ngIf="editingId === emp.id" class="btn btn-sm btn-secondary"
                          (click)="cancelEdit()">Cancel</button>
                  <button *ngIf="editingId !== emp.id" class="btn btn-sm btn-danger"
                          (click)="confirmDelete(emp)">Remove</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bulk Add Modal -->
      <div class="modal-backdrop" *ngIf="showBulkModal" (click)="showBulkModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom: 1rem;">Add Employees</h2>
          <p class="text-muted mb-2" style="font-size:0.85rem">Enter employee names, one per line:</p>
          <div class="form-group">
            <textarea class="form-control" rows="10" [(ngModel)]="bulkNames"
                      placeholder="Rahul Sharma&#10;Priya Patel&#10;Amit Kumar"></textarea>
          </div>
          <div class="flex gap-1" style="justify-content: flex-end;">
            <button class="btn btn-secondary" (click)="showBulkModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="bulkAdd()" [disabled]="!bulkNames.trim()">
              Add Employees
            </button>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
      <div class="modal-backdrop" *ngIf="showImportModal" (click)="showImportModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom: 1rem;">Import from File</h2>
          <p class="text-muted mb-2" style="font-size:0.85rem">Upload a CSV or Excel file with employee names in the first column.</p>
          <div class="form-group">
            <input type="file" class="form-control" accept=".csv,.xlsx,.xls,.txt"
                   (change)="onFileSelected($event)" id="importFile">
          </div>
          <div class="flex gap-1" style="justify-content: flex-end;">
            <button class="btn btn-secondary" (click)="showImportModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="importFile()" [disabled]="!selectedFile">
              Import
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <div class="modal-backdrop" *ngIf="deleteTarget" (click)="deleteTarget = null">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h2 style="margin-bottom: 1rem;">Remove Employee</h2>
          <p>Are you sure you want to remove <strong>{{ deleteTarget.name }}</strong>?</p>
          <p class="text-muted mt-1" style="font-size:0.85rem">This will deactivate the employee, not permanently delete them.</p>
          <div class="flex gap-1 mt-2" style="justify-content: flex-end;">
            <button class="btn btn-secondary" (click)="deleteTarget = null">Cancel</button>
            <button class="btn btn-danger" (click)="deleteEmployee()">Remove</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-input {
      width: 250px;
    }

    @media (max-width: 768px) {
      .search-input { width: 100%; }
    }
  `]
})
export class EmployeesComponent implements OnInit {
  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  loading = true;
  searchTerm = '';
  bulkNames = '';
  showBulkModal = false;
  showImportModal = false;
  selectedFile: File | null = null;
  editingId: number | null = null;
  editName = '';
  deleteTarget: Employee | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(private employeeService: EmployeeService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.employeeService.getEmployees().subscribe({
      next: data => {
        this.employees = data;
        this.filterEmployees();
        this.loading = false;
      },
      error: err => {
        this.errorMessage = 'Failed to load employees';
        this.loading = false;
      }
    });
  }

  filterEmployees() {
    const term = this.searchTerm.toLowerCase();
    this.filteredEmployees = this.employees.filter(e =>
      e.name.toLowerCase().includes(term)
    );
  }

  bulkAdd() {
    const names = this.bulkNames.split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (names.length === 0) return;

    this.employeeService.bulkCreateEmployees(names).subscribe({
      next: created => {
        this.successMessage = `${created.length} employees added successfully`;
        this.showBulkModal = false;
        this.bulkNames = '';
        this.loadEmployees();
        this.autoClearSuccess();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to add employees';
      }
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
  }

  importFile() {
    if (!this.selectedFile) return;

    this.employeeService.importFromFile(this.selectedFile).subscribe({
      next: result => {
        this.successMessage = result.message;
        this.showImportModal = false;
        this.selectedFile = null;
        this.loadEmployees();
        this.autoClearSuccess();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to import file';
      }
    });
  }

  startEdit(emp: Employee) {
    this.editingId = emp.id!;
    this.editName = emp.name;
  }

  saveEdit(emp: Employee) {
    if (!this.editName.trim()) return;

    this.employeeService.updateEmployee(emp.id!, { name: this.editName.trim() }).subscribe({
      next: updated => {
        emp.name = updated.name;
        this.cancelEdit();
        this.successMessage = 'Employee updated';
        this.autoClearSuccess();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to update employee';
      }
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.editName = '';
  }

  confirmDelete(emp: Employee) {
    this.deleteTarget = emp;
  }

  deleteEmployee() {
    if (!this.deleteTarget) return;

    this.employeeService.deleteEmployee(this.deleteTarget.id!).subscribe({
      next: () => {
        this.successMessage = `${this.deleteTarget!.name} removed`;
        this.deleteTarget = null;
        this.loadEmployees();
        this.autoClearSuccess();
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Failed to remove employee';
        this.deleteTarget = null;
      }
    });
  }

  private autoClearSuccess() {
    setTimeout(() => this.successMessage = '', 4000);
  }
}
