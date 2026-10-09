import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { ShiftConfigComponent } from './components/shift-config/shift-config.component';
import { RosterComponent } from './components/roster/roster.component';
import { LoginComponent } from './components/login/login.component';
import { AdminUsersComponent } from './components/admin/admin-users.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'employees', component: EmployeesComponent, canActivate: [authGuard] },
  { path: 'shifts', component: ShiftConfigComponent, canActivate: [authGuard] },
  { path: 'roster', component: RosterComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminUsersComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
