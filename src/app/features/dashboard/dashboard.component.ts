import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ActivityLog,
  Project,
  TaskItem,
  TaskPriority,
  TaskStatus,
  User,
} from '../../core/models/models';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="dashboard-page">
      <div class="page-header">
        <div>
          <h1>Visão Executiva & Operações</h1>
          <p>Acompanhamento consolidado de projetos, entregas da sprint e indicadores de SLA.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/kanban" class="btn btn-secondary">Abrir Quadro Kanban</a>
          <button type="button" class="btn btn-primary" (click)="showQuickTaskModal = true">
            + Nova Tarefa Rápida
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="card kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Total de Projetos</span>
            <span class="kpi-icon indigo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
          </div>
          <div class="kpi-value">{{ projects.length }}</div>
          <div class="kpi-foot">{{ activeProjectsCount }} em execução ativa</div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Total de Tarefas</span>
            <span class="kpi-icon blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="7" y1="9" x2="17" y2="9" />
                <line x1="7" y1="13" x2="13" y2="13" />
              </svg>
            </span>
          </div>
          <div class="kpi-value">{{ initialTotalTasksCount }}</div>
          <div class="kpi-foot">Distribuídas em {{ projects.length }} projetos</div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Tarefas Pendentes</span>
            <span class="kpi-icon amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div class="kpi-value">{{ pendingTasksCount }}</div>
          <div class="kpi-foot">Aguardando finalização</div>
        </div>

        <div class="card kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Tarefas Concluídas</span>
            <span class="kpi-icon emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
          </div>
          <div class="kpi-value">{{ completedTasksCount }}</div>
          <div class="kpi-foot">{{ completionRate }}% do backlog entregue</div>
        </div>

        <div class="card kpi-card danger-border">
          <div class="kpi-top">
            <span class="kpi-label">Tarefas Atrasadas</span>
            <span class="kpi-icon rose">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div class="kpi-value text-danger">{{ overdueTasks.length }}</div>
          <div class="kpi-foot">SLA de entrega ultrapassado</div>
        </div>
      </div>

      <!-- Main Analytics Row -->
      <div class="analytics-grid">
        <!-- Chart: Tasks by Status -->
        <div class="card section-card">
          <div class="section-header">
            <div>
              <h3>Distribuição de Tarefas por Status</h3>
              <p>Volume absoluto e percentual em cada etapa do fluxo de trabalho</p>
            </div>
            <span class="badge badge-status-in_progress">Sprint Atual</span>
          </div>

          <div class="status-chart-container">
            @for (bar of statusChartData; track bar.status) {
              <div class="chart-row">
                <div class="chart-row-meta">
                  <span class="status-dot" [style.background]="bar.color"></span>
                  <span class="status-name">{{ bar.label }}</span>
                  <span class="status-count">{{ bar.count }} tarefas ({{ bar.percent }}%)</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    [style.width.%]="bar.percent"
                    [style.background]="bar.color"
                  ></div>
                </div>
              </div>
            }
          </div>

          <div class="priority-summary">
            <div class="prio-box">
              <span class="prio-label">Críticas</span>
              <strong class="text-danger">{{ countByPriority('critica') }}</strong>
            </div>
            <div class="prio-box">
              <span class="prio-label">Alta Prioridade</span>
              <strong>{{ countByPriority('alta') }}</strong>
            </div>
            <div class="prio-box">
              <span class="prio-label">Média Prioridade</span>
              <strong>{{ countByPriority('media') }}</strong>
            </div>
            <div class="prio-box">
              <span class="prio-label">Baixa Prioridade</span>
              <strong>{{ countByPriority('baixa') }}</strong>
            </div>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="card section-card">
          <div class="section-header">
            <div>
              <h3>Atividades Recentes</h3>
              <p>Histórico em tempo real de movimentações da equipe</p>
            </div>
          </div>

          <div class="activity-feed">
            @for (act of activities.slice(0, 6); track act.id) {
              <div class="activity-item">
                <div class="avatar">{{ getUserInitials(act.userId) }}</div>
                <div class="activity-content">
                  <p>
                    <strong>{{ getUserName(act.userId) }}</strong>
                    {{ act.action }}
                    <span class="target-highlight">{{ act.targetName }}</span>
                  </p>
                  <small>{{ act.timestamp }}</small>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Bottom Row: Overdue Tasks & Active Projects -->
      <div class="bottom-grid">
        <div class="card section-card">
          <div class="section-header">
            <div>
              <h3>Atenção Imediata: Tarefas em Atraso</h3>
              <p>Itens não concluídos com data limite anterior a hoje</p>
            </div>
            <a routerLink="/tasks" class="link-more">Ver todas →</a>
          </div>

          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tarefa</th>
                  <th>Projeto</th>
                  <th>Responsável</th>
                  <th>Prioridade</th>
                  <th>Vencimento</th>
                </tr>
              </thead>
              <tbody>
                @for (t of overdueTasks.slice(0, 6); track t.id) {
                  <tr>
                    <td class="mono">{{ t.code }}</td>
                    <td class="font-medium">{{ t.title }}</td>
                    <td>{{ getProjectName(t.projectId) }}</td>
                    <td>{{ getUserName(t.assigneeId) }}</td>
                    <td>
                      <span class="badge" [ngClass]="'badge-prio-' + t.priority">
                        {{ formatPriority(t.priority) }}
                      </span>
                    </td>
                    <td class="text-danger font-medium">{{ t.dueDate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Task Creation Modal -->
      @if (showQuickTaskModal) {
        <div class="modal-backdrop" (click)="showQuickTaskModal = false">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Criar Tarefa Rápida</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="showQuickTaskModal = false">
                ✕
              </button>
            </div>
            <form [formGroup]="quickTaskForm" (ngSubmit)="saveQuickTask()">
              <div class="modal-body">
                <div class="form-group">
                  <label>Título da Tarefa</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="title"
                    placeholder="Ex: Implementar cache Redis na consulta de saldo"
                  />
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label>Projeto</label>
                    <select class="form-control" formControlName="projectId">
                      @for (p of projects; track p.id) {
                        <option [value]="p.id">{{ p.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Responsável</label>
                    <select class="form-control" formControlName="assigneeId">
                      @for (u of users; track u.id) {
                        <option [value]="u.id">{{ u.name }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-row-2">
                  <div class="form-group">
                    <label>Prioridade</label>
                    <select class="form-control" formControlName="priority">
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Data de Entrega</label>
                    <input type="date" class="form-control" formControlName="dueDate" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="showQuickTaskModal = false"
                >
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;

        h1 {
          font-size: 23px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        p {
          font-size: 13.5px;
          color: var(--text-secondary);
          margin-top: 2px;
        }
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .kpi-card {
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;

        &.danger-border {
          border-color: #fecaca;
          background: linear-gradient(180deg, #ffffff 0%, #fffbfb 100%);
        }
      }

      .kpi-top {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .kpi-label {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
        }
      }

      .kpi-icon {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &.indigo {
          background: #eef2ff;
          color: #4f46e5;
        }
        &.blue {
          background: #eff6ff;
          color: #2563eb;
        }
        &.amber {
          background: #fef3c7;
          color: #d97706;
        }
        &.emerald {
          background: #ecfdf5;
          color: #059669;
        }
        &.rose {
          background: #fee2e2;
          color: #dc2626;
        }
      }

      .kpi-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.1;
      }

      .kpi-foot {
        font-size: 12px;
        color: var(--text-muted);
      }

      .text-danger {
        color: #dc2626 !important;
      }

      .font-medium {
        font-weight: 500;
      }

      .analytics-grid {
        display: grid;
        grid-template-columns: 1.35fr 0.65fr;
        gap: 20px;
        margin-bottom: 24px;
      }

      .section-card {
        padding: 22px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;

        h3 {
          font-size: 15.5px;
          font-weight: 600;
          color: var(--text-primary);
        }

        p {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }
      }

      .status-chart-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 24px;
      }

      .chart-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .chart-row-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .status-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .status-count {
          margin-left: auto;
          font-size: 12.5px;
          color: var(--text-secondary);
          font-weight: 500;
        }
      }

      .progress-track {
        width: 100%;
        height: 10px;
        background: #f1f5f9;
        border-radius: 999px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
      }

      .priority-summary {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        padding-top: 18px;
        border-top: 1px solid var(--border-color);

        .prio-box {
          background: #f8fafc;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;

          .prio-label {
            font-size: 11.5px;
            color: var(--text-muted);
          }

          strong {
            font-size: 18px;
            color: var(--text-primary);
          }
        }
      }

      .activity-feed {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);

        &:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .activity-content {
          font-size: 13px;
          color: var(--text-secondary);

          strong {
            color: var(--text-primary);
          }

          .target-highlight {
            color: var(--brand-primary);
            font-weight: 500;
          }

          small {
            display: block;
            font-size: 11.5px;
            color: var(--text-muted);
            margin-top: 2px;
          }
        }
      }

      .link-more {
        font-size: 13px;
        font-weight: 600;
        color: var(--brand-primary);
        text-decoration: none;
      }

      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      @media (max-width: 1180px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .analytics-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
        .priority-summary {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  projects: Project[] = [];
  tasks: TaskItem[] = [];
  users: User[] = [];
  activities: ActivityLog[] = [];

  initialTotalTasksCount = 0;
  pendingTasksCount = 0;
  completedTasksCount = 0;
  completionRate = 0;
  activeProjectsCount = 0;
  overdueTasks: TaskItem[] = [];

  statusChartData: {
    status: TaskStatus;
    label: string;
    count: number;
    percent: number;
    color: string;
  }[] = [];

  showQuickTaskModal = false;

  quickTaskForm = this.fb.group({
    title: ['', [Validators.required]],
    projectId: ['prj-1'],
    assigneeId: ['usr-3'],
    priority: ['media'],
    dueDate: ['2026-11-25'],
  });

  ngOnInit(): void {
    this.users = this.store.getUsersSnapshot();
    this.projects = this.store.getProjectsSnapshot();
    this.tasks = this.store.getTasksSnapshot();
    this.activities = [];

    this.initialTotalTasksCount = this.tasks.length;
    this.pendingTasksCount = this.tasks.filter((t) => t.status === 'todo').length;

    this.store.projects$.subscribe((proj) => {
      this.projects = proj;
      this.activeProjectsCount = proj.filter((p) => p.status === 'in_progress').length;
    });

    this.store.tasks$.subscribe((taskList) => {
      this.tasks = taskList;
      this.recalculateLiveMetrics(taskList);
    });

    this.store.activities$.subscribe((acts) => {
      this.activities = acts;
    });
  }

  private recalculateLiveMetrics(taskList: TaskItem[]): void {
    const total = taskList.length || 1;
    this.completedTasksCount = taskList.filter((t) => t.status === 'done').length;
    this.completionRate = Math.round((this.completedTasksCount / total) * 100);

    const today = '2026-11-11';
    this.overdueTasks = taskList.filter(
      (t) => t.status !== 'done' && t.dueDate && t.dueDate < today
    );

    const statusConfig: { status: TaskStatus; label: string; color: string }[] = [
      { status: 'todo', label: 'A fazer', color: '#64748b' },
      { status: 'in_progress', label: 'Em andamento', color: '#2563eb' },
      { status: 'in_review', label: 'Em revisão', color: '#d97706' },
      { status: 'done', label: 'Concluída', color: '#059669' },
    ];

    this.statusChartData = statusConfig.map((cfg) => {
      const count = taskList.filter((t) => t.status === cfg.status).length;
      return {
        ...cfg,
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  }

  countByPriority(prio: TaskPriority): number {
    return this.tasks.filter((t) => t.priority === prio).length;
  }

  getUserName(id: string): string {
    return this.users.find((u) => u.id === id)?.name || 'Não atribuído';
  }

  getUserInitials(id: string): string {
    return this.users.find((u) => u.id === id)?.avatar || 'TF';
  }

  getProjectName(id: string): string {
    return this.projects.find((p) => p.id === id)?.name || 'Projeto';
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

  saveQuickTask(): void {
    const val = this.quickTaskForm.value;
    this.store.addTask({
      title: val.title || '',
      description: 'Tarefa criada através do atalho rápido do Dashboard.',
      projectId: val.projectId || 'prj-1',
      assigneeId: val.assigneeId || 'usr-1',
      priority: (val.priority as TaskPriority) || 'media',
      status: 'todo',
      createdAt: '2026-11-11',
      dueDate: val.dueDate || '2026-11-25',
    });
    this.showQuickTaskModal = false;
    this.quickTaskForm.patchValue({ title: '' });
    this.toast.show('Tarefa criada', 'A tarefa foi adicionada ao projeto com sucesso.');
  }
}

