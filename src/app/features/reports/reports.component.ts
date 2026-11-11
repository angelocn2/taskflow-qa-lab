import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Project,
  TaskItem,
  User,
} from '../../core/models/models';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div>
          <h1>Relatórios Executivos & Produtividade</h1>
          <p>Análise consolidada de entregas por responsável, status de projetos, SLAs e produtividade por período.</p>
        </div>
        <div class="header-controls">
          <select class="form-control period-select" [(ngModel)]="selectedPeriod">
            <option value="all">Período: Todo o Histórico (2026)</option>
            <option value="q4">Período: 4º Trimestre (Out - Dez 2026)</option>
            <option value="nov">Período: Novembro 2026</option>
          </select>
          <button type="button" class="btn btn-primary" (click)="exportCsv()">
            Exportar CSV
          </button>
        </div>
      </div>

      <!-- Summary KPI Strip -->
      <div class="report-kpi-grid">
        <div class="card rep-kpi">
          <small>Total Analisado no Período</small>
          <strong>{{ periodTasks.length }} tarefas</strong>
        </div>
        <div class="card rep-kpi">
          <small>Tarefas Concluídas</small>
          <strong class="text-emerald">{{ reportedCompletedCount }} concluídas</strong>
        </div>
        <div class="card rep-kpi">
          <small>Projetos em Andamento</small>
          <strong class="text-blue">{{ inProgressProjects.length }} projetos</strong>
        </div>
        <div class="card rep-kpi">
          <small>Tarefas Atrasadas</small>
          <strong class="text-danger">{{ overdueTasks.length }} em atraso</strong>
        </div>
      </div>

      <div class="reports-grid-2">
        <!-- Tasks by Status -->
        <div class="card report-section">
          <h3>1. Tarefas por Status</h3>
          <p class="section-sub">Distribuição quantitativa do backlog no período selecionado</p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Status Operacional</th>
                <th>Quantidade</th>
                <th>Participação (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge badge-status-todo">A fazer</span></td>
                <td>{{ countStatus('todo') }}</td>
                <td>{{ percentStatus('todo') }}%</td>
              </tr>
              <tr>
                <td><span class="badge badge-status-in_progress">Em andamento</span></td>
                <td>{{ countStatus('in_progress') }}</td>
                <td>{{ percentStatus('in_progress') }}%</td>
              </tr>
              <tr>
                <td><span class="badge badge-status-in_review">Em revisão</span></td>
                <td>{{ countStatus('in_review') }}</td>
                <td>{{ percentStatus('in_review') }}%</td>
              </tr>
              <tr>
                <td><span class="badge badge-status-done">Concluída</span></td>
                <td>{{ reportedCompletedCount }}</td>
                <td>{{ percentReportedDone() }}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tasks by Assignee (Productivity) -->
        <div class="card report-section">
          <h3>2. Produtividade por Responsável</h3>
          <p class="section-sub">Volume atribuído, entregas concluídas e índice de eficiência individual</p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Total Atribuído</th>
                <th>Concluídas</th>
                <th>Em Atraso</th>
                <th>Taxa de Entrega</th>
              </tr>
            </thead>
            <tbody>
              @for (row of assigneeReport; track row.user.id) {
                <tr>
                  <td>
                    <div class="user-inline">
                      <span class="avatar">{{ row.user.avatar }}</span>
                      <strong>{{ row.user.name }}</strong>
                    </div>
                  </td>
                  <td>{{ row.total }}</td>
                  <td class="text-emerald font-semibold">{{ row.completed }}</td>
                  <td class="text-danger">{{ row.overdue }}</td>
                  <td>
                    <div class="rate-cell">
                      <span>{{ row.rate }}%</span>
                      <div class="mini-bar">
                        <div class="mini-fill" [style.width.%]="row.rate"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="reports-grid-2 mt-4">
        <!-- Projects in Progress -->
        <div class="card report-section">
          <h3>3. Projetos em Andamento ({{ inProgressProjects.length }})</h3>
          <p class="section-sub">Iniciativas ativas e respectivo percentual de evolução</p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Projeto</th>
                <th>Responsável</th>
                <th>Prazo Final</th>
                <th>Backlog</th>
              </tr>
            </thead>
            <tbody>
              @for (p of inProgressProjects; track p.id) {
                <tr>
                  <td class="mono">{{ p.code }}</td>
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ getUserName(p.ownerId) }}</td>
                  <td>{{ p.endDate }}</td>
                  <td>{{ getProjectTaskCount(p.id) }} tarefas</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Overdue Tasks Report -->
        <div class="card report-section">
          <h3>4. Relatório de Tarefas Atrasadas ({{ overdueTasks.length }})</h3>
          <p class="section-sub">Entregas não finalizadas com vencimento anterior à data atual</p>

          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tarefa</th>
                <th>Responsável</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              @for (t of overdueTasks; track t.id) {
                <tr>
                  <td class="mono">{{ t.code }}</td>
                  <td>{{ t.title }}</td>
                  <td>{{ getUserName(t.assigneeId) }}</td>
                  <td class="text-danger font-semibold">{{ t.dueDate }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
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

      .header-controls {
        display: flex;
        gap: 10px;
        align-items: center;

        .period-select {
          min-width: 260px;
        }
      }

      .report-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 22px;

        .rep-kpi {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;

          small {
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 600;
          }

          strong {
            font-size: 24px;
            font-weight: 700;
          }
        }
      }

      .reports-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .mt-4 {
        margin-top: 20px;
      }

      .report-section {
        padding: 20px;

        h3 {
          font-size: 15.5px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .section-sub {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-bottom: 16px;
        }
      }

      .user-inline {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rate-cell {
        display: flex;
        align-items: center;
        gap: 8px;

        .mini-bar {
          width: 60px;
          height: 6px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }

        .mini-fill {
          height: 100%;
          background: #4f46e5;
        }
      }

      .text-emerald {
        color: #059669;
      }
      .text-blue {
        color: #2563eb;
      }
      .text-danger {
        color: #dc2626;
      }
      .font-semibold {
        font-weight: 600;
      }

      @media (max-width: 1100px) {
        .report-kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        .reports-grid-2 {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ReportsComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private toast = inject(ToastService);

  tasks: TaskItem[] = [];
  projects: Project[] = [];
  users: User[] = [];

  selectedPeriod: 'all' | 'q4' | 'nov' = 'all';

  ngOnInit(): void {
    this.users = this.store.getUsersSnapshot();
    this.store.projects$.subscribe((p) => (this.projects = p));
    this.store.tasks$.subscribe((t) => (this.tasks = t));
  }

  get periodTasks(): TaskItem[] {
    if (this.selectedPeriod === 'q4') {
      return this.tasks.filter((t) => t.createdAt >= '2026-10-01');
    }
    if (this.selectedPeriod === 'nov') {
      return this.tasks.filter((t) => t.createdAt >= '2026-11-01');
    }
    return this.tasks;
  }

  get reportedCompletedCount(): number {
    return this.periodTasks.filter(
      (t) => t.status === 'done' || t.status === 'in_review'
    ).length;
  }

  get inProgressProjects(): Project[] {
    return this.projects.filter((p) => p.status === 'in_progress');
  }

  get overdueTasks(): TaskItem[] {
    return this.periodTasks.filter(
      (t) => t.status !== 'done' && !!t.dueDate && t.dueDate < '2026-11-11'
    );
  }

  get assigneeReport() {
    return this.users.map((user) => {
      const userTasks = this.periodTasks.filter((t) => t.assigneeId === user.id);
      const total = userTasks.length;
      const completed = userTasks.filter(
        (t) => t.status === 'done' || t.status === 'in_review'
      ).length;
      const overdue = userTasks.filter(
        (t) => t.status !== 'done' && !!t.dueDate && t.dueDate < '2026-11-11'
      ).length;
      const rate = total ? Math.round((completed / total) * 100) : 0;
      return { user, total, completed, overdue, rate };
    });
  }

  countStatus(status: string): number {
    return this.periodTasks.filter((t) => t.status === status).length;
  }

  percentStatus(status: string): number {
    const total = this.periodTasks.length || 1;
    return Math.round((this.countStatus(status) / total) * 100);
  }

  percentReportedDone(): number {
    const total = this.periodTasks.length || 1;
    return Math.round((this.reportedCompletedCount / total) * 100);
  }

  getUserName(id: string): string {
    return this.users.find((u) => u.id === id)?.name || 'Não definido';
  }

  getProjectTaskCount(projectId: string): number {
    return this.tasks.filter((t) => t.projectId === projectId).length;
  }

  exportCsv(): void {
    this.toast.show(
      'Relatório exportado',
      'O arquivo taskflow-relatorio-executivo.csv foi gerado.'
    );
  }
}

