import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-icon">
            <svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">SmartRoster</span>
            <span class="brand-tagline">Shift Management</span>
          </div>
        </div>

        <div class="sidebar-nav">
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
        </div>

        <div class="sidebar-footer">
          <div class="footer-text">Created by DC</div>
        </div>
      </nav>

      <main class="main-content">
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
      width: 240px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 100;
      transition: transform var(--transition-base);
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 1.25rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--accent-primary);
      color: #fff;
      border-radius: var(--radius-sm);
      box-shadow: 0 2px 8px rgba(26, 115, 232, 0.35);
    }

    .brand-icon .icon-svg {
      width: 20px;
      height: 20px;
      stroke: #fff;
    }

    .brand-name {
      font-size: 1.05rem;
      font-weight: 800;
      color: var(--text-heading);
      display: block;
      letter-spacing: -0.3px;
    }

    .brand-tagline {
      font-size: 0.6rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1.2px;
      display: block;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 500;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .nav-item:hover {
      background: rgba(26, 115, 232, 0.08);
      color: var(--text-heading);
    }

    .nav-item.active {
      background: rgba(26, 115, 232, 0.12);
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
    }

    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
    }

    .footer-text {
      font-size: 0.65rem;
      color: var(--text-muted);
      text-align: center;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .main-content {
      flex: 1;
      margin-left: 240px;
      min-height: 100vh;
      background: var(--bg-primary);
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
export class AppComponent {}
