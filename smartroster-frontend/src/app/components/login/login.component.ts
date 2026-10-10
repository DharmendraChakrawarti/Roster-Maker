import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DepartmentService } from '../../services/department.service';
import { CreateUserRequest, ManagerSummary, Department } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-glow-bg"></div>
      <div class="login-glow-bg-secondary"></div>

      <div class="login-container">
        <!-- Brand Header -->
        <div class="brand-header">
          <div class="brand-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h1 class="brand-title">SmartRoster</h1>
          <p class="brand-subtitle">Shift & Workforce Management Portal</p>
        </div>

        <!-- Auth Card -->
        <div class="card auth-card">
          <!-- Segmented Tab Switcher -->
          <div class="auth-tabs">
            <button
              type="button"
              class="auth-tab-btn"
              [class.active]="activeTab === 'login'"
              (click)="setTab('login')">
              Sign In
            </button>
            <button
              type="button"
              class="auth-tab-btn"
              [class.active]="activeTab === 'register'"
              (click)="setTab('register')">
              Create Account
            </button>
          </div>

          <!-- Alert Messages -->
          <div *ngIf="errorMessage" class="alert alert-danger mt-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div *ngIf="successMessage" class="alert alert-success mt-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>{{ successMessage }}</span>
          </div>

          <!-- SIGN IN FORM -->
          <form *ngIf="activeTab === 'login'" (ngSubmit)="onLogin()" class="auth-form mt-3">
            <div class="form-group">
              <label class="form-label">Username or Email</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  class="form-control with-icon"
                  placeholder="Enter username or email"
                  [(ngModel)]="loginUsername"
                  name="username"
                  required
                  [disabled]="loading"
                  autocomplete="username" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  class="form-control with-icon with-action"
                  placeholder="Enter password"
                  [(ngModel)]="loginPassword"
                  name="password"
                  required
                  [disabled]="loading"
                  autocomplete="current-password" />
                <button
                  type="button"
                  class="toggle-pw-btn"
                  (click)="showPassword = !showPassword"
                  tabindex="-1"
                  [title]="showPassword ? 'Hide password' : 'Show password'">
                  <svg *ngIf="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <svg *ngIf="showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block submit-btn" [disabled]="loading || !loginUsername || !loginPassword">
              <span *ngIf="!loading">Sign In</span>
              <span *ngIf="loading">Authenticating...</span>
            </button>
          </form>

          <!-- REGISTER FORM -->
          <form *ngIf="activeTab === 'register'" (ngSubmit)="onRegister()" class="auth-form mt-3">
            <!-- Simple Manager and Staff Buttons -->
            <div class="form-group mb-2">
              <label class="form-label">Select Account Role</label>
              <div class="role-segmented-group">
                <button
                  type="button"
                  class="role-btn"
                  [class.active]="selectedRole === 'MANAGER'"
                  (click)="setRole('MANAGER')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <span>Manager</span>
                </button>

                <button
                  type="button"
                  class="role-btn"
                  [class.active]="selectedRole === 'USER'"
                  (click)="setRole('USER')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                  <span>Staff</span>
                </button>
              </div>
            </div>

            <!-- Reporting Manager Dropdown (Only for Staff accounts) -->
            <div *ngIf="selectedRole === 'USER'" class="form-group staff-manager-field">
              <label class="form-label">
                Reporting Manager <span class="required-star">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <select
                  class="form-control with-icon"
                  [(ngModel)]="registerData.managerId"
                  name="regManagerId"
                  required
                  [disabled]="loading || managers.length === 0">
                  <option [ngValue]="undefined" disabled>Choose your reporting manager</option>
                  <option *ngFor="let m of managers" [ngValue]="m.id">
                    {{ m.fullName }} (&#64;{{ m.username }}) — {{ m.department || 'Operations' }}
                  </option>
                </select>
              </div>
              <p *ngIf="managers.length === 0" class="field-warn">No managers found. Default manager will be assigned.</p>
            </div>

            <div class="form-group">
              <label class="form-label">Full Name</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  class="form-control with-icon"
                  placeholder="Enter your full name"
                  [(ngModel)]="registerData.fullName"
                  name="regFullName"
                  required
                  [disabled]="loading" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Username</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path>
                </svg>
                <input
                  type="text"
                  class="form-control with-icon"
                  placeholder="Choose a unique username"
                  [(ngModel)]="registerData.username"
                  name="regUsername"
                  required
                  [disabled]="loading" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  type="email"
                  class="form-control with-icon"
                  placeholder="name@company.com"
                  [(ngModel)]="registerData.email"
                  name="regEmail"
                  required
                  [disabled]="loading" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Department</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <select class="form-control with-icon" [(ngModel)]="registerData.department" name="regDept" [disabled]="loading" required>
                  <option value="" disabled>Select department</option>
                  <option *ngFor="let d of departments" [value]="d.name">{{ d.name }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type="password"
                  class="form-control with-icon"
                  placeholder="Minimum 6 characters"
                  [(ngModel)]="registerData.password"
                  name="regPassword"
                  required
                  minlength="6"
                  [disabled]="loading" />
              </div>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block submit-btn"
              [disabled]="loading || !registerData.username || !registerData.email || !registerData.password || !registerData.fullName || (selectedRole === 'USER' && managers.length > 0 && !registerData.managerId)">
              <span *ngIf="!loading">Create {{ selectedRole === 'MANAGER' ? 'Manager' : 'Staff' }} Account</span>
              <span *ngIf="loading">Creating Account...</span>
            </button>
          </form>
        </div>

        <div class="login-footer">
          <span>SmartRoster • by DC</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top, #14161f 0%, #0c0d12 100%);
      padding: 1.5rem 1rem;
      position: relative;
      overflow: hidden;
    }

    .login-glow-bg {
      position: absolute;
      width: 550px;
      height: 550px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(26, 115, 232, 0.15) 0%, rgba(15, 16, 20, 0) 70%);
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      filter: blur(40px);
    }

    .login-glow-bg-secondary {
      position: absolute;
      width: 350px;
      height: 350px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(138, 180, 248, 0.08) 0%, rgba(15, 16, 20, 0) 70%);
      bottom: 10%;
      right: 20%;
      pointer-events: none;
      filter: blur(50px);
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 10;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .brand-icon-box {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      background: linear-gradient(135deg, #1a73e8 0%, #1255aa 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(26, 115, 232, 0.4);
      margin-bottom: 0.85rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .brand-title {
      font-size: 1.85rem;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: var(--text-heading);
      margin: 0;
    }

    .brand-subtitle {
      font-size: 0.95rem;
      color: var(--text-secondary);
      margin-top: 5px;
      letter-spacing: 0.2px;
    }

    .auth-card {
      padding: 2rem 1.75rem 2.25rem 1.75rem;
      background: rgba(24, 25, 32, 0.88);
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      width: 100%;
      box-sizing: border-box;
    }

    /* Tabs */
    .auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: rgba(15, 16, 22, 0.8);
      padding: 5px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      gap: 6px;
    }

    .auth-tab-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-weight: 700;
      font-size: 0.95rem;
      padding: 11px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: center;
      min-height: 44px;
    }

    .auth-tab-btn:hover {
      color: var(--text-primary);
    }

    .auth-tab-btn.active {
      background: var(--accent-primary);
      color: #fff;
      box-shadow: 0 2px 10px rgba(26, 115, 232, 0.35);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      width: 100%;
    }

    /* Simple Role Button Controls */
    .role-segmented-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 6px;
      width: 100%;
    }

    .role-btn {
      background: var(--bg-input);
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      color: var(--text-secondary);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all var(--transition-fast);
      min-height: 48px;
      width: 100%;
    }

    .role-btn:hover {
      border-color: var(--border-hover);
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    .role-btn.active {
      background: rgba(26, 115, 232, 0.18);
      border-color: var(--accent-primary);
      color: #fff;
      box-shadow: 0 0 12px rgba(26, 115, 232, 0.25);
    }

    .role-btn.active svg {
      stroke: var(--accent-primary-light);
    }

    /* Form Fields */
    .form-group {
      margin-bottom: 0;
      width: 100%;
    }

    .form-label {
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 7px;
      display: block;
    }

    .required-star {
      color: var(--accent-danger);
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      pointer-events: none;
      transition: color var(--transition-fast);
    }

    .form-control.with-icon {
      padding-left: 44px;
      padding-right: 14px;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: 1rem;
      min-height: 48px;
      color: var(--text-primary);
      width: 100%;
    }

    .form-control.with-action {
      padding-right: 44px;
    }

    .form-control:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.25);
      background: #15161f;
    }

    .input-wrapper:focus-within .input-icon {
      color: var(--accent-primary-light);
    }

    .toggle-pw-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      border-radius: 4px;
      transition: color var(--transition-fast);
    }

    .toggle-pw-btn:hover {
      color: var(--text-primary);
    }

    .field-warn {
      font-size: 0.82rem;
      color: var(--accent-warning);
      margin-top: 5px;
      margin-bottom: 0;
    }

    .btn-block {
      width: 100%;
    }

    .submit-btn {
      min-height: 50px;
      font-weight: 800;
      font-size: 1rem;
      margin-top: 0.5rem;
      border-radius: var(--radius-md);
      letter-spacing: 0.5px;
    }

    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    @media (max-width: 600px) {
      .login-wrapper {
        padding: 1.25rem 0.75rem !important;
        width: 100vw !important;
        overflow-x: hidden !important;
      }

      .login-container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .brand-title {
        font-size: 1.75rem !important;
        font-weight: 900;
      }

      .brand-subtitle {
        font-size: 0.95rem !important;
      }

      .auth-card {
        padding: 1.5rem 1.15rem !important;
        border-radius: var(--radius-lg) !important;
      }

      .auth-tab-btn {
        font-size: 1rem !important;
        font-weight: 800 !important;
        padding: 12px 14px !important;
        min-height: 48px;
      }

      .role-segmented-group {
        gap: 8px;
      }

      .role-btn {
        font-size: 1rem !important;
        font-weight: 800 !important;
        padding: 12px 14px !important;
        min-height: 48px;
      }

      .form-label {
        font-size: 0.88rem !important;
        font-weight: 800 !important;
        margin-bottom: 6px;
      }

      .form-control {
        font-size: 1rem !important;
        min-height: 48px;
      }

      .submit-btn {
        min-height: 50px !important;
        font-size: 1rem !important;
        font-weight: 900 !important;
        letter-spacing: 0.5px;
      }

      .login-footer {
        font-size: 0.85rem !important;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  activeTab: 'login' | 'register' = 'login';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  loginUsername = '';
  loginPassword = '';

  selectedRole: 'MANAGER' | 'USER' = 'MANAGER';
  managers: ManagerSummary[] = [];
  departments: Department[] = [];

  registerData: CreateUserRequest = {
    username: '',
    email: '',
    password: '',
    fullName: '',
    department: '',
    role: 'MANAGER',
    managerId: undefined
  };

  constructor(
    private authService: AuthService,
    private deptService: DepartmentService,
    private router: Router
  ) {
    if (this.authService.isLoggedIn) {
      if (this.authService.isStaff) {
        this.router.navigate(['/roster']);
      } else if (this.authService.isAdmin) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  ngOnInit(): void {
    this.loadManagers();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.deptService.getDepartments().subscribe({
      next: (depts) => {
        this.departments = depts;
        if (!this.registerData.department && this.departments.length > 0) {
          this.registerData.department = this.departments[0].name;
        }
      },
      error: () => { }
    });
  }

  loadManagers(): void {
    this.authService.getManagers().subscribe({
      next: (mgrs) => {
        this.managers = mgrs;
      },
      error: () => { }
    });
  }

  setTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'register') {
      this.loadManagers();
      this.loadDepartments();
    }
  }

  setRole(role: 'MANAGER' | 'USER'): void {
    this.selectedRole = role;
    this.registerData.role = role;
    if (role === 'MANAGER') {
      this.registerData.managerId = undefined;
    }
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin(): void {
    if (!this.loginUsername || !this.loginPassword) return;
    this.loading = true;
    this.clearMessages();

    this.authService.login(this.loginUsername, this.loginPassword).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'USER') {
          this.router.navigate(['/roster']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  onRegister(): void {
    if (!this.registerData.department && this.departments.length > 0) {
      this.registerData.department = this.departments[0].name;
    }
    this.loading = true;
    this.clearMessages();

    this.registerData.role = this.selectedRole;

    this.authService.register(this.registerData).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => {
          if (res.user.role === 'USER') {
            this.router.navigate(['/roster']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        }, 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to create account.';
      }
    });
  }
}
