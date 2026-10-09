import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { ShiftConfigComponent } from './components/shift-config/shift-config.component';
import { RosterComponent } from './components/roster/roster.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'employees', component: EmployeesComponent },
  { path: 'shifts', component: ShiftConfigComponent },
  { path: 'roster', component: RosterComponent },
  { path: '**', redirectTo: 'dashboard' }
];
