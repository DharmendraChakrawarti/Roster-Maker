import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { DepartmentService } from '../../services/department.service';
import { User, CreateUserRequest, UpdateUserRequest, AdminStats, ManagerSummary, Department, CreateDepartmentRequest } from '../../models/auth.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <div class="header-badge-row">
            <h1>System Administration</h1>
            <span class="badge-role-admin">Admin Console</span>
          </div>
          <p class="text-secondary subtitle">
            Full organizational control: manage user accounts, roles, departmental structures, and authentication credentials
          </p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" (click)="loadData()" [disabled]="loading" title="Refresh Data">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh
          </button>
          <button *ngIf="activeAdminTab === 'users'" class="btn btn-primary" (click)="openCreateModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New User
          </button>
          <button *ngIf="activeAdminTab === 'departments'" class="btn btn-primary" (click)="openCreateDeptModal()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Department
          </button>
        </div>
      </div>

      <!-- Admin Tab Switcher -->
      <div class="admin-tab-bar mb-3">
        <button class="admin-tab-btn" [class.active]="activeAdminTab === 'users'" (click)="activeAdminTab = 'users'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>User Directory & Accounts ({{ users.length }})</span>
        </button>
        <button class="admin-tab-btn" [class.active]="activeAdminTab === 'departments'" (click)="activeAdminTab = 'departments'">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          <span>Department Management ({{ departments.length }})</span>
        </button>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{{ successMessage }}</span>
        <button class="alert-close-btn" (click)="clearMessages()">✕</button>
      </div>
      <div *ngIf="errorMessage" class="alert alert-danger">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{{ errorMessage }}</span>
        <button class="alert-close-btn" (click)="clearMessages()">✕</button>
      </div>

      <!-- ================= USERS TAB ================= -->
      <ng-container *ngIf="activeAdminTab === 'users'">
        <!-- Overview Metric Cards -->
        <div class="metrics-grid mb-3">
          <div class="card metric-card">
            <div class="metric-top">
              <span class="metric-title">Total Accounts</span>
              <div class="metric-icon-box icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value">{{ stats?.totalUsers || users.length }}</div>
            <div class="metric-hint text-secondary">Registered system users</div>
          </div>

          <div class="card metric-card">
            <div class="metric-top">
              <span class="metric-title">Active Users</span>
              <div class="metric-icon-box icon-green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div class="metric-value text-success">{{ stats?.activeUsers || getActiveCount() }}</div>
            <div class="metric-hint text-secondary">Enabled & authenticating</div>
          </div>

          <div class="card metric-card">
            <div class="metric-top">
              <span class="metric-title">Administrators</span>
              <div class="metric-icon-box icon-purple">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value text-purple">{{ stats?.adminCount || getRoleCount('ADMIN') }}</div>
            <div class="metric-hint text-secondary">Full access privileges</div>
          </div>

          <div class="card metric-card">
            <div class="metric-top">
              <span class="metric-title">Managers & Staff</span>
              <div class="metric-icon-box icon-amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
            </div>
            <div class="metric-value text-amber">{{ (stats?.managerCount || getRoleCount('MANAGER')) + (stats?.userCount || getRoleCount('USER')) }}</div>
            <div class="metric-hint text-secondary">Shift supervisors & workers</div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="card mb-3 filter-toolbar">
          <div class="search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              class="form-control search-input"
              placeholder="Search by name, username, or email..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="applyFilter()" />
          </div>

          <div class="filter-group">
            <span class="filter-label">Role:</span>
            <div class="filter-pills">
              <button
                class="filter-pill"
                [class.active]="selectedRoleFilter === 'ALL'"
                (click)="selectedRoleFilter = 'ALL'; applyFilter()">
                All ({{ users.length }})
              </button>
              <button
                class="filter-pill"
                [class.active]="selectedRoleFilter === 'ADMIN'"
                (click)="selectedRoleFilter = 'ADMIN'; applyFilter()">
                Admin ({{ getRoleCount('ADMIN') }})
              </button>
              <button
                class="filter-pill"
                [class.active]="selectedRoleFilter === 'MANAGER'"
                (click)="selectedRoleFilter = 'MANAGER'; applyFilter()">
                Manager ({{ getRoleCount('MANAGER') }})
              </button>
              <button
                class="filter-pill"
                [class.active]="selectedRoleFilter === 'USER'"
                (click)="selectedRoleFilter = 'USER'; applyFilter()">
                Staff ({{ getRoleCount('USER') }})
              </button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-label">Status:</span>
            <div class="filter-pills">
              <button
                class="filter-pill"
                [class.active]="selectedStatusFilter === 'ALL'"
                (click)="selectedStatusFilter = 'ALL'; applyFilter()">
                All
              </button>
              <button
                class="filter-pill"
                [class.active]="selectedStatusFilter === 'ACTIVE'"
                (click)="selectedStatusFilter = 'ACTIVE'; applyFilter()">
                Active
              </button>
              <button
                class="filter-pill"
                [class.active]="selectedStatusFilter === 'DISABLED'"
                (click)="selectedStatusFilter = 'DISABLED'; applyFilter()">
                Disabled
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="card table-card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Reporting Manager</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Member Since</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredUsers.length === 0">
                  <td colspan="9" class="text-center py-4 text-muted">
                    No user accounts matching the filter criteria.
                  </td>
                </tr>
                <tr *ngFor="let u of filteredUsers">
                  <!-- Profile -->
                  <td>
                    <div class="user-profile-cell">
                      <div class="user-avatar" [class.avatar-admin]="u.role === 'ADMIN'" [class.avatar-manager]="u.role === 'MANAGER'">
                        {{ getInitials(u.fullName) }}
                      </div>
                      <div class="user-info">
                        <div class="user-fullname">{{ u.fullName }}</div>
                        <div class="user-username">&#64;{{ u.username }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Email -->
                  <td class="email-cell text-secondary">
                    {{ u.email }}
                  </td>

                  <!-- Role -->
                  <td>
                    <span class="badge" [class.badge-admin]="u.role === 'ADMIN'" [class.badge-manager]="u.role === 'MANAGER'" [class.badge-user]="u.role === 'USER'">
                      {{ u.role }}
                    </span>
                  </td>

                  <!-- Department -->
                  <td>
                    <span class="dept-pill">{{ u.department || 'Operations' }}</span>
                  </td>

                  <!-- Reporting Manager -->
                  <td>
                    <span *ngIf="u.role === 'USER' && u.managerName" class="manager-badge">
                      {{ u.managerName }}
                    </span>
                    <span *ngIf="u.role === 'USER' && !u.managerName" class="text-muted text-sm">
                      Unassigned
                    </span>
                    <span *ngIf="u.role === 'MANAGER'" class="badge badge-manager">
                      Lead Manager
                    </span>
                    <span *ngIf="u.role === 'ADMIN'" class="text-muted text-sm">—</span>
                  </td>

                  <!-- Status -->
                  <td>
                    <span class="status-indicator" [class.status-active]="u.active" [class.status-disabled]="!u.active">
                      <span class="status-dot"></span>
                      {{ u.active ? 'Active' : 'Disabled' }}
                    </span>
                  </td>

                  <!-- Last Login -->
                  <td class="text-secondary text-sm">
                    {{ formatDateTime(u.lastLoginAt) }}
                  </td>

                  <!-- Member Since -->
                  <td class="text-secondary text-sm">
                    {{ formatDate(u.createdAt) }}
                  </td>

                  <!-- Actions -->
                  <td class="text-right">
                    <div class="action-btn-group">
                      <button class="icon-btn" (click)="openEditModal(u)" title="Edit User">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      <button
                        class="icon-btn"
                        [class.text-danger]="u.active"
                        [class.text-success]="!u.active"
                        (click)="toggleStatus(u)"
                        [title]="u.active ? 'Disable Account' : 'Activate Account'">
                        <svg *ngIf="u.active" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                        <svg *ngIf="!u.active" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </button>

                      <button class="icon-btn" (click)="openResetPasswordModal(u)" title="Reset Password">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </button>

                      <button class="icon-btn text-danger" (click)="deleteUser(u)" title="Delete User">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- ================= DEPARTMENTS TAB ================= -->
      <ng-container *ngIf="activeAdminTab === 'departments'">
        <div class="card table-card">
          <div class="dept-header-section p-3">
            <div class="dept-header-info">
              <h3 class="m-0">Organizational Departments</h3>
              <p class="text-secondary text-sm m-0">
                Departments configure team divisions, manager assignments, and operational scopes across the system.
              </p>
            </div>
            <button class="btn btn-primary btn-sm" (click)="openCreateDeptModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Department
            </button>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Description</th>
                  <th>Active Assigned Members</th>
                  <th>Created Date</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="departments.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">
                    No departments created yet. Click "Add Department" to add one.
                  </td>
                </tr>
                <tr *ngFor="let d of departments">
                  <td>
                    <div class="dept-name-cell">
                      <div class="dept-icon-box">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                        </svg>
                      </div>
                      <span class="font-bold">{{ d.name }}</span>
                    </div>
                  </td>
                  <td class="text-secondary text-sm">
                    {{ d.description || 'General organizational unit' }}
                  </td>
                  <td>
                    <span class="user-count-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                      {{ d.userCount !== undefined ? d.userCount : 0 }} Assigned
                    </span>
                  </td>
                  <td class="text-secondary text-sm">
                    {{ formatDate(d.createdAt) }}
                  </td>
                  <td class="text-right">
                    <button class="icon-btn text-danger" (click)="deleteDepartment(d)" title="Delete Department">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- CREATE / EDIT USER MODAL -->
      <div *ngIf="showUserModal" class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditMode ? 'Edit User Details' : 'Create New User' }}</h3>
            <button class="modal-close" (click)="closeUserModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="saveUser()" class="modal-form">
              <div class="form-group">
                <label class="form-label">Full Name *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="userFormData.fullName"
                  name="fullName"
                  placeholder="Enter full name"
                  required />
              </div>

              <div class="form-group" *ngIf="!isEditMode">
                <label class="form-label">Username *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="userFormData.username"
                  name="username"
                  placeholder="Enter unique username"
                  required />
              </div>

              <div class="form-group">
                <label class="form-label">Email Address *</label>
                <input
                  type="email"
                  class="form-control"
                  [(ngModel)]="userFormData.email"
                  name="email"
                  placeholder="Enter user email address"
                  required />
              </div>

              <div class="form-group">
                <label class="form-label">System Role *</label>
                <select class="form-control" [(ngModel)]="userFormData.role" name="role">
                  <option value="USER">USER — Staff / Shift Worker (View Only)</option>
                  <option value="MANAGER">MANAGER — Shift Operations Lead</option>
                  <option value="ADMIN">ADMIN — Full System Administrator</option>
                </select>
              </div>

              <!-- Reporting Manager Selector for Staff (Managers Only, Admins Excluded) -->
              <div class="form-group" *ngIf="userFormData.role === 'USER'">
                <label class="form-label">Reporting Manager</label>
                <select class="form-control" [(ngModel)]="userFormData.managerId" name="managerId">
                  <option [ngValue]="undefined">Unassigned (Default Manager)</option>
                  <option *ngFor="let m of managers" [ngValue]="m.id">
                    {{ m.fullName }} (&#64;{{ m.username }}) — {{ m.department || 'Operations' }}
                  </option>
                </select>
                <small class="text-secondary mt-1 d-block" style="font-size: 0.75rem;">
                  Staff will view shifts and rosters managed by this selected manager.
                </small>
              </div>

              <!-- Dynamic Department Dropdown -->
              <div class="form-group">
                <label class="form-label">Department *</label>
                <select class="form-control" [(ngModel)]="userFormData.department" name="department" required>
                  <option value="" disabled>Select Department</option>
                  <option *ngFor="let d of departments" [value]="d.name">{{ d.name }}</option>
                </select>
              </div>

              <div class="form-group" *ngIf="!isEditMode">
                <label class="form-label">Initial Password *</label>
                <input
                  type="password"
                  class="form-control"
                  [(ngModel)]="userFormData.password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  required
                  minlength="6" />
              </div>

              <div class="form-group" *ngIf="isEditMode">
                <label class="form-label">Change Password (optional)</label>
                <input
                  type="password"
                  class="form-control"
                  [(ngModel)]="userFormData.newPassword"
                  name="newPassword"
                  placeholder="Leave blank to keep current password" />
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeUserModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="loading || !userFormData.fullName || !userFormData.email || (!isEditMode && (!userFormData.username || !userFormData.password))">
                  {{ isEditMode ? 'Save Changes' : 'Create Account' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- CREATE DEPARTMENT MODAL -->
      <div *ngIf="showDeptModal" class="modal-backdrop">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <h3>Add New Department</h3>
            <button class="modal-close" (click)="closeDeptModal()">✕</button>
          </div>
          <div class="modal-body">
            <form (ngSubmit)="saveDepartment()" class="modal-form">
              <div class="form-group">
                <label class="form-label">Department Name *</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="deptFormData.name"
                  name="deptName"
                  placeholder="e.g. Operations, Logistics, IT Support"
                  required />
              </div>

              <div class="form-group">
                <label class="form-label">Description (Optional)</label>
                <textarea
                  class="form-control"
                  rows="3"
                  [(ngModel)]="deptFormData.description"
                  name="deptDesc"
                  placeholder="Brief description of department scope"></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeDeptModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="loading || !deptFormData.name.trim()">
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- RESET PASSWORD MODAL -->
      <div *ngIf="showResetPwModal" class="modal-backdrop">
        <div class="modal-card modal-sm">
          <div class="modal-header">
            <h3>Reset Password</h3>
            <button class="modal-close" (click)="closeResetPasswordModal()">✕</button>
          </div>
          <div class="modal-body">
            <p class="text-secondary text-sm">
              Setting a new password for <strong>{{ targetUser?.fullName }}</strong> (&#64;{{ targetUser?.username }}).
            </p>
            <div class="form-group mt-3">
              <label class="form-label">New Password *</label>
              <input
                type="password"
                class="form-control"
                [(ngModel)]="newPasswordInput"
                placeholder="Minimum 6 characters"
                minlength="6" />
            </div>
            <div class="modal-actions mt-3">
              <button class="btn btn-secondary" (click)="closeResetPasswordModal()">Cancel</button>
              <button class="btn btn-primary" (click)="confirmResetPassword()" [disabled]="!newPasswordInput || newPasswordInput.length < 6">
                Update Password
              </button>
            </div>
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

    .header-badge-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-role-admin {
      background: rgba(26, 115, 232, 0.15);
      border: 1px solid rgba(26, 115, 232, 0.4);
      color: var(--accent-primary-light);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Admin Tab Bar */
    .admin-tab-bar {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }

    .admin-tab-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 8px 16px;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all var(--transition-fast);
    }

    .admin-tab-btn:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
    }

    .admin-tab-btn.active {
      background: rgba(26, 115, 232, 0.18);
      border-color: var(--accent-primary);
      color: #fff;
    }

    /* Metric Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .metric-card {
      padding: 1.25rem;
    }

    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .metric-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-blue { background: rgba(26, 115, 232, 0.15); color: var(--accent-primary-light); }
    .icon-green { background: rgba(19, 115, 51, 0.15); color: var(--accent-success-light); }
    .icon-purple { background: rgba(156, 39, 176, 0.15); color: #d084f7; }
    .icon-amber { background: rgba(249, 171, 0, 0.15); color: var(--accent-warning); }

    .metric-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-heading);
      margin: 8px 0 2px 0;
    }

    .text-purple { color: #d084f7 !important; }
    .text-amber { color: var(--accent-warning) !important; }

    .metric-hint {
      font-size: 0.75rem;
    }

    /* Filter Toolbar */
    .filter-toolbar {
      padding: 1rem 1.25rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1.25rem;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 240px;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    .search-input {
      padding-left: 36px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
    }

    .filter-pill {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 5px 10px;
      border-radius: 14px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .filter-pill:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
    }

    .filter-pill.active {
      background: rgba(26, 115, 232, 0.15);
      border-color: var(--accent-primary);
      color: #fff;
    }

    /* Table styles */
    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .dept-header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }

    .dept-name-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dept-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: rgba(26, 115, 232, 0.15);
      color: var(--accent-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-profile-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      color: var(--text-primary);
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .avatar-admin {
      border-color: var(--accent-primary);
      background: rgba(26, 115, 232, 0.15);
      color: var(--accent-primary-light);
    }

    .avatar-manager {
      border-color: var(--accent-warning);
      background: rgba(249, 171, 0, 0.15);
      color: var(--accent-warning);
    }

    .user-fullname {
      font-weight: 600;
      color: var(--text-heading);
      font-size: 0.85rem;
    }

    .user-username {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    .badge-admin {
      background: rgba(26, 115, 232, 0.2);
      color: var(--accent-primary-light);
      border: 1px solid rgba(26, 115, 232, 0.4);
    }

    .badge-manager {
      background: rgba(249, 171, 0, 0.2);
      color: var(--accent-warning);
      border: 1px solid rgba(249, 171, 0, 0.4);
    }

    .badge-user {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
    }

    .dept-pill {
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 10px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-active .status-dot {
      background: var(--accent-success-light);
      box-shadow: 0 0 6px rgba(52, 168, 83, 0.6);
    }

    .status-disabled .status-dot {
      background: var(--accent-danger-light);
      box-shadow: 0 0 6px rgba(234, 67, 53, 0.6);
    }

    .text-sm {
      font-size: 0.75rem;
    }

    .action-btn-group {
      display: inline-flex;
      gap: 6px;
    }

    .icon-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .icon-btn:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    /* Modal styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 480px;
      padding: 1.5rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    }

    .modal-sm {
      max-width: 400px;
    }

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
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .alert-close-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
    }

    .manager-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(249, 171, 0, 0.1);
      color: var(--accent-warning);
      border: 1px solid rgba(249, 171, 0, 0.25);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
    }

    @media (max-width: 1100px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .header-badge-row h1 {
        font-size: 1.6rem !important;
        font-weight: 800;
      }

      .badge-role-admin {
        font-size: 0.82rem !important;
        padding: 4px 10px !important;
      }

      .admin-tab-bar {
        flex-direction: column;
        gap: 8px;
      }

      .admin-tab-btn {
        width: 100%;
        justify-content: center;
        padding: 12px 14px !important;
        font-size: 0.95rem !important;
        font-weight: 700;
        min-height: 48px;
      }

      .metrics-grid {
        grid-template-columns: 1fr !important;
        gap: 0.85rem !important;
      }

      .metric-card {
        padding: 1.25rem 1.15rem !important;
      }

      .metric-title {
        font-size: 0.88rem !important;
        font-weight: 800 !important;
      }

      .metric-value {
        font-size: 2.1rem !important;
        font-weight: 900 !important;
      }

      .metric-hint {
        font-size: 0.85rem !important;
      }

      .dept-header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding: 1.25rem 1rem !important;
      }

      .dept-header-section h3 {
        font-size: 1.25rem !important;
        font-weight: 800;
      }

      .dept-header-section .btn {
        width: 100%;
        justify-content: center;
        min-height: 48px;
        font-size: 0.95rem !important;
      }

      .user-avatar {
        width: 38px;
        height: 38px;
        font-size: 0.88rem;
      }

      .user-fullname {
        font-size: 0.95rem !important;
        font-weight: 700;
      }

      .user-username {
        font-size: 0.82rem !important;
      }

      .dept-pill {
        font-size: 0.82rem !important;
        padding: 4px 10px !important;
      }

      .status-indicator {
        font-size: 0.82rem !important;
      }

      .icon-btn {
        width: 36px;
        height: 36px;
      }

      .icon-btn svg {
        width: 16px;
        height: 16px;
      }

      .action-btn-group {
        gap: 8px;
      }

      .user-count-badge {
        font-size: 0.82rem !important;
        padding: 4px 10px !important;
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  activeAdminTab: 'users' | 'departments' = 'users';

  users: User[] = [];
  filteredUsers: User[] = [];
  departments: Department[] = [];
  stats: AdminStats | null = null;
  loading = false;
  successMessage = '';
  errorMessage = '';

  searchQuery = '';
  selectedRoleFilter: 'ALL' | 'ADMIN' | 'MANAGER' | 'USER' = 'ALL';
  selectedStatusFilter: 'ALL' | 'ACTIVE' | 'DISABLED' = 'ALL';

  managers: ManagerSummary[] = [];

  // User Modal State
  showUserModal = false;
  isEditMode = false;
  targetUserId: number | null = null;
  userFormData: {
    fullName: string;
    username: string;
    email: string;
    role: string;
    department: string;
    managerId?: number;
    password?: string;
    newPassword?: string;
  } = {
    fullName: '',
    username: '',
    email: '',
    role: 'USER',
    department: '',
    managerId: undefined,
    password: '',
    newPassword: ''
  };

  // Department Modal State
  showDeptModal = false;
  deptFormData: CreateDepartmentRequest = {
    name: '',
    description: ''
  };

  showResetPwModal = false;
  targetUser: User | null = null;
  newPasswordInput = '';

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private deptService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.clearMessages();

    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to load user list.';
      }
    });

    this.deptService.getDepartments().subscribe({
      next: (depts) => {
        this.departments = depts;
      },
      error: (err) => console.error('Error fetching departments', err)
    });

    this.adminService.getAdminStats().subscribe({
      next: (stats) => (this.stats = stats),
      error: (err) => console.error('Error fetching admin stats', err)
    });

    this.authService.getManagers().subscribe({
      next: (mgrs) => (this.managers = mgrs),
      error: (err) => console.error('Error fetching managers list', err)
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  applyFilter(): void {
    let list = [...this.users];

    // Search query filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    // Role filter
    if (this.selectedRoleFilter !== 'ALL') {
      list = list.filter((u) => u.role === this.selectedRoleFilter);
    }

    // Status filter
    if (this.selectedStatusFilter === 'ACTIVE') {
      list = list.filter((u) => u.active);
    } else if (this.selectedStatusFilter === 'DISABLED') {
      list = list.filter((u) => !u.active);
    }

    this.filteredUsers = list;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getRoleCount(role: string): number {
    return this.users.filter((u) => u.role === role).length;
  }

  getActiveCount(): number {
    return this.users.filter((u) => u.active).length;
  }

  formatDateTime(dtStr?: string): string {
    if (!dtStr) return 'Never';
    const d = new Date(dtStr);
    return isNaN(d.getTime()) ? dtStr : d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dtStr?: string): string {
    if (!dtStr) return '-';
    const d = new Date(dtStr);
    return isNaN(d.getTime()) ? dtStr : d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.targetUserId = null;
    this.userFormData = {
      fullName: '',
      username: '',
      email: '',
      role: 'USER',
      department: this.departments.length > 0 ? this.departments[0].name : '',
      managerId: this.managers.length > 0 ? this.managers[0].id : undefined,
      password: '',
      newPassword: ''
    };
    this.showUserModal = true;
  }

  openEditModal(user: User): void {
    this.isEditMode = true;
    this.targetUserId = user.id;
    this.userFormData = {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department || (this.departments.length > 0 ? this.departments[0].name : ''),
      managerId: user.managerId,
      password: '',
      newPassword: ''
    };
    this.showUserModal = true;
  }

  closeUserModal(): void {
    this.showUserModal = false;
  }

  saveUser(): void {
    this.loading = true;
    this.clearMessages();

    if (this.isEditMode && this.targetUserId) {
      const updateReq: UpdateUserRequest = {
        fullName: this.userFormData.fullName,
        email: this.userFormData.email,
        role: this.userFormData.role,
        department: this.userFormData.department,
        managerId: this.userFormData.role === 'USER' ? this.userFormData.managerId : undefined,
        newPassword: this.userFormData.newPassword || undefined
      };

      this.adminService.updateUser(this.targetUserId, updateReq).subscribe({
        next: (updated) => {
          this.loading = false;
          this.successMessage = `User @${updated.username} updated successfully.`;
          this.closeUserModal();
          this.loadData();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || err.message || 'Failed to update user.';
        }
      });
    } else {
      const createReq: CreateUserRequest = {
        fullName: this.userFormData.fullName,
        username: this.userFormData.username,
        email: this.userFormData.email,
        password: this.userFormData.password || '',
        role: this.userFormData.role,
        department: this.userFormData.department,
        managerId: this.userFormData.role === 'USER' ? this.userFormData.managerId : undefined
      };

      this.adminService.createUser(createReq).subscribe({
        next: (created) => {
          this.loading = false;
          this.successMessage = `User @${created.username} created successfully.`;
          this.closeUserModal();
          this.loadData();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || err.message || 'Failed to create user.';
        }
      });
    }
  }

  toggleStatus(user: User): void {
    this.clearMessages();
    this.adminService.toggleUserStatus(user.id).subscribe({
      next: (updated) => {
        user.active = updated.active;
        this.successMessage = `User @${user.username} is now ${user.active ? 'active' : 'disabled'}.`;
        this.adminService.getAdminStats().subscribe((s) => (this.stats = s));
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Failed to toggle status.';
      }
    });
  }

  openResetPasswordModal(user: User): void {
    this.targetUser = user;
    this.newPasswordInput = '';
    this.showResetPwModal = true;
  }

  closeResetPasswordModal(): void {
    this.showResetPwModal = false;
    this.targetUser = null;
  }

  confirmResetPassword(): void {
    if (!this.targetUser || !this.newPasswordInput) return;
    this.clearMessages();

    this.adminService.resetPassword(this.targetUser.id, this.newPasswordInput).subscribe({
      next: () => {
        this.successMessage = `Password for @${this.targetUser?.username} has been reset successfully.`;
        this.closeResetPasswordModal();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Failed to reset password.';
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete user @${user.username} (${user.fullName})? This action cannot be undone.`)) {
      return;
    }

    this.clearMessages();
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage = `User @${user.username} deleted successfully.`;
        this.loadData();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Failed to delete user.';
      }
    });
  }

  // Department Management Handlers
  openCreateDeptModal(): void {
    this.deptFormData = {
      name: '',
      description: ''
    };
    this.showDeptModal = true;
  }

  closeDeptModal(): void {
    this.showDeptModal = false;
  }

  saveDepartment(): void {
    if (!this.deptFormData.name.trim()) return;
    this.loading = true;
    this.clearMessages();

    this.deptService.createDepartment(this.deptFormData).subscribe({
      next: (created) => {
        this.loading = false;
        this.successMessage = `Department "${created.name}" created successfully.`;
        this.closeDeptModal();
        this.deptService.getDepartments().subscribe((depts) => (this.departments = depts));
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to create department.';
      }
    });
  }

  deleteDepartment(dept: Department): void {
    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
      return;
    }

    this.clearMessages();
    this.deptService.deleteDepartment(dept.id).subscribe({
      next: () => {
        this.successMessage = `Department "${dept.name}" deleted successfully.`;
        this.deptService.getDepartments().subscribe((depts) => (this.departments = depts));
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Failed to delete department.';
      }
    });
  }
}
