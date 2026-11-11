import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './core/layout/shell.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { KanbanComponent } from './features/kanban/kanban.component';
import { NotificationsComponent } from './features/notifications/notifications.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { ReportsComponent } from './features/reports/reports.component';
import { TasksComponent } from './features/tasks/tasks.component';
import { UsersComponent } from './features/users/users.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'projects', component: ProjectsComponent },
      { path: 'tasks', component: TasksComponent },
      { path: 'kanban', component: KanbanComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'users', component: UsersComponent },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
