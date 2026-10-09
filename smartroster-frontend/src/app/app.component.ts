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
          <div class="brand-icon">📋</div>
          <div class="brand-text">
            <span class="brand-name">SmartRoster</span>
            <span class="brand-tagline">Shift Management</span>
          </div>
        </div>

        <div class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Dashboard</span>
          </a>
          <a routerLink="/employees" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">👥</span>
            <span class="nav-text">Employees</span>
          </a>
          <a routerLink="/shifts" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Shift Config</span>
          </a>
          <a routerLink="/roster" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📅</span>
            <span class="nav-text">Roster</span>
          </a>
        </div>

        <div class="sidebar-footer">
          <div class="footer-text">SmartRoster v1.0</div>
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
      width: 260px;
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
      gap: 14px;
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .brand-icon {
      font-size: 1.8rem;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #84A282 0%, #B8CFB3 100%);
      color: #121915;
      border-radius: var(--radius-md);
      box-shadow: 0 2px 10px rgba(132, 162, 130, 0.35);
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--palette-cream);
      display: block;
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 0.7rem;
      color: var(--palette-sage-light);
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 500;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .nav-item:hover {
      background: rgba(132, 162, 130, 0.12);
      color: var(--palette-cream);
    }

    .nav-item.active {
      background: linear-gradient(135deg, rgba(132, 162, 130, 0.22) 0%, rgba(184, 207, 179, 0.1) 100%);
      color: var(--palette-cream);
      font-weight: 700;
      border: 1px solid rgba(132, 162, 130, 0.3);
      box-shadow: inset 3px 0 0 #84A282;
    }

    .nav-icon {
      font-size: 1.2rem;
      width: 28px;
      text-align: center;
    }

    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .footer-text {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-align: center;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
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
