import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TaskflowStoreService } from '../services/taskflow-store.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell" [class.sidebar-open]="mobileMenuOpen">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="logo-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div class="brand-meta">
            <span class="brand-title">TaskFlow</span>
            <span class="brand-workspace">Workspace Corporativo</span>
          </div>
        </div>

        <div class="nav-section">
          <span class="nav-label">GESTÃO & EXECUÇÃO</span>
          <nav class="nav-list">
            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span>Dashboard</span>
            </a>

            <a
              routerLink="/projects"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>Projetos</span>
            </a>

            <a
              routerLink="/tasks"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>Tarefas</span>
            </a>

            <a
              routerLink="/kanban"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
              <span>Quadro Kanban</span>
            </a>
          </nav>
        </div>

        <div class="nav-section">
          <span class="nav-label">GOVERNANÇA & ANÁLISE</span>
          <nav class="nav-list">
            <a
              routerLink="/reports"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Relatórios</span>
            </a>

            <a
              routerLink="/notifications"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notificações</span>
              @if ((unreadCount$ | async) || 0; as unread) {
                @if (unread > 0) {
                  <span class="nav-badge">{{ unread }}</span>
                }
              }
            </a>

            <a
              routerLink="/users"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Usuários & Acessos</span>
            </a>
          </nav>
        </div>

        <div class="sidebar-footer">
          @if (currentUser$ | async; as user) {
            <div class="user-card">
              <div class="avatar">{{ user.avatar }}</div>
              <div class="user-details">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-role">{{ formatRole(user.role) }}</span>
              </div>
              <button
                type="button"
                class="logout-icon-btn"
                title="Encerrar sessão"
                (click)="logout()"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <header class="topbar">
          <div class="topbar-left">
            <button
              type="button"
              class="mobile-toggle"
              (click)="mobileMenuOpen = !mobileMenuOpen"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div class="env-indicator">
              <span class="status-dot"></span>
              <span>Ambiente Homologação · Build 3.8.4</span>
            </div>
          </div>

          <div class="topbar-right">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              title="Restaura os dados originais de fábrica no LocalStorage"
              (click)="resetDemoData()"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              <span>Restaurar Base</span>
            </button>

            <!-- Notification Bell Dropdown -->
            <div class="notif-dropdown-wrapper">
              <button
                type="button"
                class="bell-btn"
                (click)="notifOpen = !notifOpen"
                aria-label="Notificações"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                @if ((unreadCount$ | async) || 0; as count) {
                  @if (count > 0) {
                    <span class="bell-badge">{{ count }}</span>
                  }
                }
              </button>

              @if (notifOpen) {
                <div class="notif-popover">
                  <div class="notif-popover-header">
                    <strong>Notificações Recentes</strong>
                    <button
                      type="button"
                      class="link-action"
                      (click)="markAllRead()"
                    >
                      Marcar todas como lidas
                    </button>
                  </div>
                  <div class="notif-popover-body">
                    @for (n of (notifications$ | async)?.slice(0, 5); track n.id) {
                      <div class="notif-row" [class.unread]="!n.read">
                        <div class="notif-row-title">{{ n.title }}</div>
                        <div class="notif-row-msg">{{ n.message }}</div>
                      </div>
                    }
                  </div>
                  <div class="notif-popover-footer">
                    <a routerLink="/notifications" (click)="notifOpen = false">
                      Ver central de notificações →
                    </a>
                  </div>
                </div>
              }
            </div>

            @if (currentUser$ | async; as user) {
              <div class="top-user-pill">
                <span class="avatar">{{ user.avatar }}</span>
                <span class="top-user-name">{{ user.name }}</span>
              </div>
            }
          </div>
        </header>

        <main class="page-content" (click)="notifOpen = false">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Toast Container -->
      <div class="toast-stack">
        @for (t of toasts$ | async; track t.id) {
          <div class="toast-item" [attr.data-type]="t.type">
            <div class="toast-body">
              <strong>{{ t.title }}</strong>
              <p>{{ t.message }}</p>
            </div>
            <button type="button" class="toast-close" (click)="dismissToast(t.id)">
              ×
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .app-shell {
        display: flex;
        min-height: 100vh;
        background: var(--bg-app);
      }

      .sidebar {
        width: 256px;
        background: var(--bg-sidebar);
        color: #e2e8f0;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        border-right: 1px solid #1e293b;
        position: sticky;
        top: 0;
        height: 100vh;
        z-index: 200;
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .logo-box {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: var(--brand-primary);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .brand-meta {
        display: flex;
        flex-direction: column;

        .brand-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
        }

        .brand-workspace {
          font-size: 11.5px;
          color: #94a3b8;
        }
      }

      .nav-section {
        padding: 18px 12px 4px;

        .nav-label {
          display: block;
          padding: 0 10px 8px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.07em;
          color: #64748b;
        }
      }

      .nav-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 9px 12px;
        border-radius: 8px;
        color: #cbd5e1;
        text-decoration: none;
        font-size: 13.5px;
        font-weight: 500;
        transition: all 0.14s ease;

        &:hover {
          background: var(--bg-sidebar-hover);
          color: #ffffff;
        }

        &.active {
          background: #4f46e5;
          color: #ffffff;
          font-weight: 600;
        }
      }

      .nav-badge {
        margin-left: auto;
        background: #ef4444;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        padding: 1px 7px;
        border-radius: 999px;
      }

      .sidebar-footer {
        margin-top: auto;
        padding: 14px 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }

      .user-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
      }

      .user-details {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 11px;
          color: #94a3b8;
        }
      }

      .logout-icon-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;

        &:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }
      }

      .main-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .topbar {
        height: 60px;
        background: #ffffff;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 26px;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .topbar-left {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .mobile-toggle {
        display: none;
        background: none;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        padding: 6px;
        cursor: pointer;
      }

      .env-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: var(--text-secondary);
        background: #f8fafc;
        border: 1px solid var(--border-color);
        padding: 5px 11px;
        border-radius: 999px;

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }
      }

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .notif-dropdown-wrapper {
        position: relative;
      }

      .bell-btn {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        cursor: pointer;

        &:hover {
          background: var(--bg-subtle);
          color: var(--text-primary);
        }
      }

      .bell-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #dc2626;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        min-width: 17px;
        height: 17px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }

      .notif-popover {
        position: absolute;
        right: 0;
        top: 44px;
        width: 350px;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
        z-index: 300;
        overflow: hidden;
      }

      .notif-popover-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        background: #f8fafc;

        strong {
          font-size: 13px;
        }

        .link-action {
          background: none;
          border: none;
          color: var(--brand-primary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
      }

      .notif-popover-body {
        max-height: 280px;
        overflow-y: auto;
      }

      .notif-row {
        padding: 11px 16px;
        border-bottom: 1px solid var(--border-color);

        &.unread {
          background: #eef2ff;
        }

        .notif-row-title {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .notif-row-msg {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }

      .notif-popover-footer {
        padding: 10px 16px;
        text-align: center;
        background: #f8fafc;

        a {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--brand-primary);
          text-decoration: none;
        }
      }

      .top-user-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 10px 4px 4px;
        border: 1px solid var(--border-color);
        border-radius: 999px;

        .top-user-name {
          font-size: 13px;
          font-weight: 500;
        }
      }

      .page-content {
        flex: 1;
        padding: 26px 30px;
        max-width: 1480px;
        width: 100%;
        margin: 0 auto;
      }

      /* Toasts */
      .toast-stack {
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 2000;
      }

      .toast-item {
        min-width: 300px;
        max-width: 400px;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 16px;
        border-radius: 10px;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        border-left: 4px solid #10b981;

        &[data-type='error'] {
          border-left-color: #ef4444;
        }
        &[data-type='warning'] {
          border-left-color: #f59e0b;
        }
        &[data-type='info'] {
          border-left-color: #3b82f6;
        }

        .toast-body {
          strong {
            display: block;
            font-size: 13px;
            margin-bottom: 2px;
          }
          p {
            font-size: 12px;
            color: #cbd5e1;
          }
        }

        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 18px;
          cursor: pointer;
          line-height: 1;
        }
      }

      @media (max-width: 960px) {
        .sidebar {
          position: fixed;
          left: -260px;
          transition: left 0.2s ease;
        }

        .app-shell.sidebar-open .sidebar {
          left: 0;
        }

        .mobile-toggle {
          display: inline-flex;
        }

        .page-content {
          padding: 18px 16px;
        }
      }
    `,
  ],
})
export class ShellComponent {
  private auth = inject(AuthService);
  private store = inject(TaskflowStoreService);
  private toast = inject(ToastService);
  private router = inject(Router);

  currentUser$ = this.auth.currentUser$;
  notifications$ = this.store.notifications$;
  unreadCount$ = this.store.unreadCount$;
  toasts$ = this.toast.toasts$;

  mobileMenuOpen = false;
  notifOpen = false;

  formatRole(role: string): string {
    const map: Record<string, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      collaborator: 'Colaborador',
    };
    return map[role] || role;
  }

  markAllRead(): void {
    this.store.markAllNotificationsAsRead();
    this.toast.show(
      'Notificações atualizadas',
      'Todas as notificações foram marcadas como lidas.',
      'info'
    );
  }

  resetDemoData(): void {
    this.store.resetDemoEnvironment();
    this.toast.show(
      'Ambiente restaurado',
      'Os dados iniciais de homologação foram recarregados.',
      'info'
    );
  }

  dismissToast(id: string): void {
    this.toast.dismiss(id);
  }

  logout(): void {
    this.auth.logout();
  }
}

