import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AppNotification, NotificationType } from '../../core/models/models';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <div>
          <h1>Central de Notificações & Alertas</h1>
          <p>Acompanhe atribuições de tarefas, mudanças de status, alertas de prazo e entregas concluídas.</p>
        </div>

        <button type="button" class="btn btn-secondary" (click)="markAllRead()">
          Marcar todas como lidas
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="selectedType === 'all'"
          (click)="selectedType = 'all'"
        >
          Todas ({{ notifications.length }})
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="selectedType === 'new_task'"
          (click)="selectedType = 'new_task'"
        >
          Novas Tarefas
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="selectedType === 'status_change'"
          (click)="selectedType = 'status_change'"
        >
          Alterações de Status
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="selectedType === 'deadline_alert'"
          (click)="selectedType = 'deadline_alert'"
        >
          Alertas de Prazo
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="selectedType === 'task_completed'"
          (click)="selectedType = 'task_completed'"
        >
          Conclusões
        </button>
      </div>

      <div class="card notif-list-card">
        @for (n of filteredNotifications; track n.id) {
          <div class="notif-item" [class.unread]="!n.read">
            <div class="notif-type-icon" [attr.data-type]="n.type">
              @switch (n.type) {
                @case ('deadline_alert') {
                  <span>!</span>
                }
                @case ('task_completed') {
                  <span>✓</span>
                }
                @case ('new_task') {
                  <span>+</span>
                }
                @default {
                  <span>↻</span>
                }
              }
            </div>

            <div class="notif-content">
              <div class="notif-top">
                <span class="type-label">{{ formatType(n.type) }}</span>
                <span class="notif-date">{{ n.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <h4>{{ n.title }}</h4>
              <p>{{ n.message }}</p>
            </div>

            <div class="notif-actions">
              @if (!n.read) {
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="markRead(n.id)"
                >
                  Marcar lida
                </button>
              }
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                (click)="deleteNotif(n.id)"
              >
                Excluir
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-notif">
            Nenhuma notificação encontrada para esta categoria.
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;

        h1 {
          font-size: 23px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        p {
          font-size: 13.5px;
          color: var(--text-secondary);
        }
      }

      .filter-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 18px;
        flex-wrap: wrap;
      }

      .tab-btn {
        padding: 7px 14px;
        border-radius: 999px;
        border: 1px solid var(--border-color);
        background: #ffffff;
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;

        &.active {
          background: var(--brand-primary);
          color: #ffffff;
          border-color: var(--brand-primary);
        }
      }

      .notif-list-card {
        overflow: hidden;
      }

      .notif-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 18px 22px;
        border-bottom: 1px solid var(--border-color);

        &:last-child {
          border-bottom: none;
        }

        &.unread {
          background: #f5f7ff;
        }
      }

      .notif-type-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 15px;
        flex-shrink: 0;
        background: #eef2ff;
        color: #4f46e5;

        &[data-type='deadline_alert'] {
          background: #fee2e2;
          color: #dc2626;
        }
        &[data-type='task_completed'] {
          background: #ecfdf5;
          color: #059669;
        }
        &[data-type='status_change'] {
          background: #fef3c7;
          color: #d97706;
        }
      }

      .notif-content {
        flex: 1;

        .notif-top {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 4px;
        }

        .type-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }

        .notif-date {
          font-size: 11.5px;
          color: var(--text-muted);
        }

        h4 {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 3px;
        }

        p {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }

      .notif-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .empty-notif {
        padding: 40px;
        text-align: center;
        color: var(--text-muted);
      }
    `,
  ],
})
export class NotificationsComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private toast = inject(ToastService);

  notifications: AppNotification[] = [];
  selectedType: 'all' | NotificationType = 'all';

  ngOnInit(): void {
    this.store.notifications$.subscribe((list) => (this.notifications = list));
  }

  get filteredNotifications(): AppNotification[] {
    if (this.selectedType === 'all') return this.notifications;
    return this.notifications.filter((n) => n.type === this.selectedType);
  }

  formatType(type: NotificationType): string {
    const map: Record<NotificationType, string> = {
      new_task: 'Nova Tarefa',
      status_change: 'Alteração de Status',
      deadline_alert: 'Alerta de Prazo',
      task_completed: 'Conclusão',
    };
    return map[type] || type;
  }

  markRead(id: string): void {
    this.store.markNotificationAsRead(id);
  }

  markAllRead(): void {
    this.store.markAllNotificationsAsRead();
    this.toast.show(
      'Notificações lidas',
      'Todas as notificações foram marcadas como lidas.'
    );
  }

  deleteNotif(id: string): void {
    this.store.deleteNotification(id);
    this.toast.show('Notificação excluída', 'O registro foi removido.');
  }
}

