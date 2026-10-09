import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- Sidebar Navigation (Only visible when logged in) -->
      <nav *ngIf="authService.isLoggedIn" class="sidebar">
        <!-- Brand Header -->
        <div class="sidebar-brand">
          <div class="brand-icon">
            <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">SmartRoster</span>
            <span class="brand-tagline">Shift Operations</span>
          </div>
        </div>

        <!-- Current User Profile Card -->
        <div *ngIf="authService.currentUser" class="user-profile-widget">
          <div class="profile-avatar" [class.admin-border]="authService.isAdmin">
            {{ getInitials(authService.currentUser.fullName) }}
          </div>
          <div class="profile-meta">
            <div class="profile-name">{{ authService.currentUser.fullName }}</div>
            <div class="profile-sub">
              <span class="profile-role-badge" [class.badge-admin]="authService.currentUser.role === 'ADMIN'" [class.badge-manager]="authService.currentUser.role === 'MANAGER'">
                {{ authService.currentUser.role }}
              </span>
              <span class="profile-dept">{{ authService.currentUser.department || 'Operations' }}</span>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="sidebar-nav">
          <div class="nav-section-title">Operations</div>

          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span class="nav-text">Dashboard</span>
          </a>

          <a routerLink="/employees" routerLinkActive="active" class="nav-item">
            <svg class="icon-svg" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span class="nav-text">Employees</span>
          </a>

          <a routerLink="/shifts" routerLinkActive="active" class="nav-item">
            <svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span class="nav-text">Shift Config</span>
          </a>

          <a routerLink="/roster" routerLinkActive="active" class="nav-item">
            <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
            <span class="nav-text">Roster</span>
          </a>

          <!-- Administrator Section -->
          <div *ngIf="authService.isAdmin" class="admin-nav-section mt-3">
            <div class="nav-section-title">Administration</div>
            <a routerLink="/admin" routerLinkActive="active" class="nav-item nav-admin-item">
              <svg class="icon-svg icon-admin" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span class="nav-text">User Administration</span>
            </a>
          </div>
        </div>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <button class="logout-btn" (click)="authService.logout()" title="Sign Out">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Sign Out</span>
          </button>
          <div class="footer-text">Created by DC</div>
        </div>
      </nav>

      <!-- Main Content Outlet -->
      <main class="main-content" [class.full-width]="!authService.isLoggedIn">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 250px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 100;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.4);
    }

    .sidebar-brand {
      padding: 1.25rem 1.25rem 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-primary) 0%, #1558b0 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(26, 115, 232, 0.35);
      flex-shrink: 0;
    }

    .brand-icon .icon-svg {
      width: 20px;
      height: 20px;
      stroke: #fff;
      fill: none;
      stroke-width: 2;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: var(--text-heading);
    }

    .brand-tagline {
      font-size: 0.65rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    /* User Profile Widget */
    .user-profile-widget {
      padding: 12px 14px;
      margin: 10px 12px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .profile-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      color: var(--accent-primary-light);
      font-weight: 700;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .profile-avatar.admin-border {
      border-color: var(--accent-primary);
      box-shadow: 0 0 8px rgba(26, 115, 232, 0.4);
    }

    .profile-meta {
      flex: 1;
      overflow: hidden;
    }

    .profile-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-heading);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .profile-sub {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }

    .profile-role-badge {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 8px;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
    }

    .profile-role-badge.badge-admin {
      background: rgba(26, 115, 232, 0.25);
      color: var(--accent-primary-light);
    }

    .profile-role-badge.badge-manager {
      background: rgba(249, 171, 0, 0.25);
      color: var(--accent-warning);
    }

    .profile-dept {
      font-size: 0.65rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Sidebar Navigation */
    .sidebar-nav {
      padding: 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      overflow-y: auto;
    }

    .nav-section-title {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 8px 12px 4px 12px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 0.85rem;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .nav-item:hover {
      background: rgba(26, 115, 232, 0.08);
      color: var(--text-heading);
    }

    .nav-item.active {
      background: rgba(26, 115, 232, 0.14);
      color: #fff;
      font-weight: 600;
      border-left: 3px solid var(--accent-primary);
    }

    .nav-item.active .icon-svg {
      stroke: var(--accent-primary-light);
    }

    .nav-item .icon-svg {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }

    .nav-admin-item.active .icon-admin {
      stroke: var(--accent-primary-light);
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 0.85rem 1rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .logout-btn {
      background: rgba(234, 67, 53, 0.08);
      border: 1px solid rgba(234, 67, 53, 0.2);
      color: var(--accent-danger-light);
      padding: 7px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.78rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all var(--transition-fast);
      width: 100%;
    }

    .logout-btn:hover {
      background: rgba(234, 67, 53, 0.16);
      border-color: var(--accent-danger);
    }

    .footer-text {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-align: center;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 250px;
      min-height: 100vh;
      background: var(--bg-primary);
    }

    .main-content.full-width {
      margin-left: 0 !important;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
      }

      .main-content {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent {
  constructor(public authService: AuthService) {}

  getInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
