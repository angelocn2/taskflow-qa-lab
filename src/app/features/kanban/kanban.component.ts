import {
  CdkDragDrop,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Project,
  TaskItem,
  TaskPriority,
  TaskStatus,
  User,
} from '../../core/models/models';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  accent: string;
}

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="kanban-page">
      <div class="page-header">
        <div>
          <h1>Quadro Kanban da Sprint</h1>
          <p>Arraste e solte os cartões entre as colunas para atualizar o fluxo de execução.</p>
        </div>

        <div class="kanban-filters">
          <select class="form-control" [(ngModel)]="selectedProjectId">
            <option value="">Todos os Projetos</option>
            @for (p of projects; track p.id) {
              <option [value]="p.id">{{ p.code }} · {{ p.name }}</option>
            }
          </select>

          <select class="form-control" [(ngModel)]="selectedAssigneeId">
            <option value="">Todos os Responsáveis</option>
            @for (u of users; track u.id) {
              <option [value]="u.id">{{ u.name }}</option>
            }
          </select>
        </div>
      </div>

      <div class="kanban-board" cdkDropListGroup>
        @for (col of columns; track col.id) {
          <div class="kanban-column">
            <div class="column-header">
              <div class="column-title-wrap">
                <span class="col-dot" [style.background]="col.accent"></span>
                <h3>{{ col.title }}</h3>
              </div>
              <span class="column-count">{{ getTasksByColumn(col.id).length }}</span>
            </div>

            <div
              class="column-dropzone"
              cdkDropList
              [cdkDropListData]="col.id"
              (cdkDropListDropped)="onCardDrop($event, col.id)"
              (dragover)="onNativeDragOver($event)"
              (drop)="onNativeDrop($event, col.id)"
            >
              @for (task of getTasksByColumn(col.id); track task.id) {
                <div
                  class="kanban-card"
                  cdkDrag
                  [cdkDragData]="task"
                  draggable="true"
                  (dragstart)="onNativeDragStart($event, task)"
                >
                  <div class="card-top-row">
                    <span class="mono task-code">{{ task.code }}</span>
                    <span class="badge" [ngClass]="'badge-prio-' + task.priority">
                      {{ formatPriority(task.priority) }}
                    </span>
                  </div>

                  <h4 class="card-title">{{ task.title || '(Sem título)' }}</h4>

                  <div class="card-project-tag">
                    {{ getProjectName(task.projectId) }}
                  </div>

                  <div class="card-bottom-row">
                    <div class="card-due" [class.overdue]="isOverdue(task)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{{ task.dueDate }}</span>
                    </div>

                    <div class="card-assignee" [title]="getUserName(task.assigneeId)">
                      <span class="avatar">{{ getUserInitials(task.assigneeId) }}</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-column-placeholder">
                  Solte tarefas aqui
                </div>
              }
            </div>
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
        gap: 16px;
        margin-bottom: 22px;
        flex-wrap: wrap;

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

      .kanban-filters {
        display: flex;
        gap: 10px;

        .form-control {
          min-width: 210px;
        }
      }

      .kanban-board {
        display: grid;
        grid-template-columns: repeat(4, minmax(280px, 1fr));
        gap: 16px;
        align-items: flex-start;
        overflow-x: auto;
        padding-bottom: 16px;
      }

      .kanban-column {
        background: #f1f5f9;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        min-height: 640px;
      }

      .column-header {
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
        background: #f8fafc;
        border-radius: 12px 12px 0 0;

        .column-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .col-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        h3 {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .column-count {
          background: #e2e8f0;
          color: #334155;
          font-size: 11.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }
      }

      .column-dropzone {
        padding: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 540px;
      }

      .kanban-card {
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 10px;
        padding: 14px;
        box-shadow: var(--shadow-xs);
        cursor: grab;
        transition: box-shadow 0.15s ease, border-color 0.15s ease;

        &:hover {
          box-shadow: var(--shadow-md);
          border-color: #cbd5e1;
        }

        &:active {
          cursor: grabbing;
        }
      }

      .card-top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .task-code {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-muted);
        }
      }

      .card-title {
        font-size: 13.5px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.4;
        margin-bottom: 10px;
      }

      .card-project-tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 500;
        color: var(--brand-primary);
        background: #eef2ff;
        padding: 2px 8px;
        border-radius: 5px;
        margin-bottom: 12px;
      }

      .card-bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 10px;
        border-top: 1px solid #f1f5f9;
      }

      .card-due {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11.5px;
        color: var(--text-secondary);

        &.overdue {
          color: #dc2626;
          font-weight: 600;
        }
      }

      .empty-column-placeholder {
        border: 1.5px dashed #cbd5e1;
        border-radius: 8px;
        padding: 28px 14px;
        text-align: center;
        color: var(--text-muted);
        font-size: 12.5px;
      }
    `,
  ],
})
export class KanbanComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private toast = inject(ToastService);

  tasks: TaskItem[] = [];
  projects: Project[] = [];
  users: User[] = [];

  selectedProjectId = '';
  selectedAssigneeId = '';
  private draggedTask: TaskItem | null = null;

  columns: KanbanColumn[] = [
    { id: 'todo', title: 'A fazer', accent: '#64748b' },
    { id: 'in_progress', title: 'Em andamento', accent: '#2563eb' },
    { id: 'in_review', title: 'Em revisão', accent: '#d97706' },
    { id: 'done', title: 'Concluído', accent: '#059669' },
  ];

  ngOnInit(): void {
    this.users = this.store.getUsersSnapshot();
    this.store.projects$.subscribe((p) => (this.projects = p));
    this.store.tasks$.subscribe((t) => (this.tasks = t));
  }

  getTasksByColumn(status: TaskStatus): TaskItem[] {
    return this.tasks.filter((t) => {
      if (t.status !== status) return false;
      if (this.selectedProjectId && t.projectId !== this.selectedProjectId) return false;
      if (this.selectedAssigneeId && t.assigneeId !== this.selectedAssigneeId) return false;
      return true;
    });
  }

  onCardDrop(event: CdkDragDrop<TaskStatus>, targetStatus: TaskStatus): void {
    const task: TaskItem = event.item.data;
    if (!task || task.status === targetStatus) return;

    this.store.updateTaskStatusFromKanban(task.id, targetStatus);
    this.toast.show(
      'Quadro atualizado',
      `${task.code} movida para "${this.getColumnTitle(targetStatus)}".`
    );
  }

  onNativeDragStart(event: DragEvent, task: TaskItem): void {
    this.draggedTask = task;
    event.dataTransfer?.setData('text/plain', task.id);
  }

  onNativeDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onNativeDrop(event: DragEvent, targetStatus: TaskStatus): void {
    event.preventDefault();
    if (!this.draggedTask || this.draggedTask.status === targetStatus) return;
    this.store.updateTaskStatusFromKanban(this.draggedTask.id, targetStatus);
    this.toast.show(
      'Quadro atualizado',
      `${this.draggedTask.code} movida para "${this.getColumnTitle(targetStatus)}".`
    );
    this.draggedTask = null;
  }

  private getColumnTitle(status: TaskStatus): string {
    return this.columns.find((c) => c.id === status)?.title || status;
  }

  isOverdue(task: TaskItem): boolean {
    return task.status !== 'done' && !!task.dueDate && task.dueDate < '2026-11-11';
  }

  getProjectName(id: string): string {
    return this.projects.find((p) => p.id === id)?.name || 'Projeto';
  }

  getUserName(id: string): string {
    return this.users.find((u) => u.id === id)?.name || 'Usuário';
  }

  getUserInitials(id: string): string {
    return this.users.find((u) => u.id === id)?.avatar || 'TF';
  }

  formatPriority(prio: TaskPriority): string {
    const map: Record<TaskPriority, string> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica',
    };
    return map[prio] || prio;
  }
}

