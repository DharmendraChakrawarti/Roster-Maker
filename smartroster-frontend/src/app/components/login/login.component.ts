import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreateUserRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-glow-bg"></div>

      <div class="login-container">
        <!-- Brand Header -->
        <div class="brand-header">
          <div class="brand-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h1 class="brand-title">SmartRoster</h1>
          <p class="brand-subtitle">Enterprise Workforce & Shift Operations</p>
        </div>

        <!-- Auth Card -->
        <div class="card auth-card">
          <!-- Tab Switcher -->
          <div class="auth-tabs">
            <button
              class="auth-tab-btn"
              [class.active]="activeTab === 'login'"
              (click)="activeTab = 'login'; clearMessages()">
              Sign In
            </button>
            <button
              class="auth-tab-btn"
              [class.active]="activeTab === 'register'"
              (click)="activeTab = 'register'; clearMessages()">
              Create Account
            </button>
          </div>

          <!-- Alert Messages -->
          <div *ngIf="errorMessage" class="alert alert-danger mt-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div *ngIf="successMessage" class="alert alert-success mt-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                  placeholder="e.g. dc or dc@smartroster.io"
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
                  class="form-control with-icon"
                  placeholder="Enter your password"
                  [(ngModel)]="loginPassword"
                  name="password"
                  required
                  [disabled]="loading"
                  autocomplete="current-password" />
                <button
                  type="button"
                  class="toggle-pw-btn"
                  (click)="showPassword = !showPassword"
                  tabindex="-1">
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
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. John Doe"
                [(ngModel)]="registerData.fullName"
                name="regFullName"
                required
                [disabled]="loading" />
            </div>

            <div class="form-group">
              <label class="form-label">Username</label>
              <input
                type="text"
                class="form-control"
                placeholder="e.g. jdoe"
                [(ngModel)]="registerData.username"
                name="regUsername"
                required
                [disabled]="loading" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                class="form-control"
                placeholder="e.g. jdoe@smartroster.io"
                [(ngModel)]="registerData.email"
                name="regEmail"
                required
                [disabled]="loading" />
            </div>

            <div class="form-group">
              <label class="form-label">Department</label>
              <select class="form-control" [(ngModel)]="registerData.department" name="regDept" [disabled]="loading">
                <option value="Operations">Operations</option>
                <option value="Engineering & Management">Engineering & Management</option>
                <option value="IT & Security">IT & Security</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <input
                type="password"
                class="form-control"
                placeholder="Minimum 6 characters"
                [(ngModel)]="registerData.password"
                name="regPassword"
                required
                minlength="6"
                [disabled]="loading" />
            </div>

            <button type="submit" class="btn btn-primary btn-block submit-btn" [disabled]="loading || !registerData.username || !registerData.email || !registerData.password || !registerData.fullName">
              <span *ngIf="!loading">Create Account</span>
              <span *ngIf="loading">Creating Account...</span>
            </button>
          </form>

          <!-- Quick 1-Click Demo Login Panel -->
          <div class="demo-logins-section">
            <div class="demo-divider">
              <span>Quick 1-Click Demo Access</span>
            </div>
            <div class="demo-cards-grid">
              <button class="demo-card demo-admin" (click)="quickLogin('dc', 'dc123')">
                <div class="demo-role-badge badge-admin">Admin</div>
                <div class="demo-user-name">DC (Creator)</div>
                <div class="demo-creds">dc / dc123</div>
              </button>

              <button class="demo-card demo-manager" (click)="quickLogin('manager', 'manager123')">
                <div class="demo-role-badge badge-manager">Manager</div>
                <div class="demo-user-name">Shift Lead</div>
                <div class="demo-creds">manager / manager123</div>
              </button>

              <button class="demo-card demo-user" (click)="quickLogin('rahul', 'user123')">
                <div class="demo-role-badge badge-staff">Staff</div>
                <div class="demo-user-name">Rahul Sharma</div>
                <div class="demo-creds">rahul / user123</div>
              </button>
            </div>
          </div>
        </div>

        <div class="login-footer">
          <span>Created by DC</span>
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
      background: var(--bg-primary);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .login-glow-bg {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(26, 115, 232, 0.12) 0%, rgba(15, 16, 20, 0) 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .login-container {
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 10;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-icon-box {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--accent-primary) 0%, #1558b0 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(26, 115, 232, 0.35);
      margin-bottom: 0.75rem;
    }

    .brand-title {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text-heading);
      margin: 0;
    }

    .brand-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .auth-card {
      padding: 1.75rem 2rem;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      border: 1px solid var(--border-color);
    }

    .auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--bg-secondary);
      padding: 4px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
    }

    .auth-tab-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.85rem;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .auth-tab-btn.active {
      background: var(--bg-card);
      color: var(--text-heading);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .form-control.with-icon {
      padding-left: 38px;
      padding-right: 38px;
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
      padding: 4px;
      transition: color var(--transition-fast);
    }

    .toggle-pw-btn:hover {
      color: var(--text-primary);
    }

    .btn-block {
      width: 100%;
    }

    .submit-btn {
      padding: 10px 16px;
      font-weight: 600;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    /* Demo Quick Logins */
    .demo-logins-section {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }

    .demo-divider {
      text-align: center;
      margin-bottom: 0.85rem;
    }

    .demo-divider span {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .demo-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .demo-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 8px 6px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: all var(--transition-fast);
    }

    .demo-card:hover {
      border-color: var(--accent-primary);
      background: var(--bg-card-hover);
      transform: translateY(-2px);
    }

    .demo-role-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 8px;
      text-transform: uppercase;
    }

    .badge-admin {
      background: rgba(26, 115, 232, 0.2);
      color: var(--accent-primary-light);
    }

    .badge-manager {
      background: rgba(249, 171, 0, 0.2);
      color: var(--accent-warning);
    }

    .badge-staff {
      background: rgba(52, 168, 83, 0.2);
      color: var(--accent-success-light);
    }

    .demo-user-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .demo-creds {
      font-size: 0.65rem;
      color: var(--text-muted);
      font-family: monospace;
    }

    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class LoginComponent {
  activeTab: 'login' | 'register' = 'login';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  loginUsername = '';
  loginPassword = '';

  registerData: CreateUserRequest = {
    username: '',
    email: '',
    password: '',
    fullName: '',
    department: 'Operations',
    role: 'USER'
  };

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
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
    this.loading = true;
    this.clearMessages();

    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || err.message || 'Failed to create account.';
      }
    });
  }

  quickLogin(username: string, pass: string): void {
    this.loginUsername = username;
    this.loginPassword = pass;
    this.onLogin();
  }
}
