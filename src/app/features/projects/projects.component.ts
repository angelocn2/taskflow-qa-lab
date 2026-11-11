import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Project,
  ProjectStatus,
  TaskItem,
  User,
} from '../../core/models/models';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="projects-page">
      @if (!selectedProject) {
        <div class="page-header">
          <div>
            <h1>Portfólio de Projetos</h1>
            <p>Gerencie cronogramas, responsáveis, escopo e progresso de entregas por iniciativa.</p>
          </div>
          <button type="button" class="btn btn-primary" (click)="openCreateModal()">
            + Novo Projeto
          </button>
        </div>

        <div class="projects-grid">
          @for (p of projects; track p.id) {
            <div class="card project-card">
              <div class="project-card-top">
                <div class="code-pill" [style.borderColor]="p.color" [style.color]="p.color">
                  {{ p.code }}
                </div>
                <span class="badge" [ngClass]="getStatusClass(p.status)">
                  {{ formatProjectStatus(p.status) }}
                </span>
              </div>

              <h3 class="project-title" (click)="viewDetails(p)">{{ p.name }}</h3>
              <p class="project-desc">{{ p.description }}</p>

              <div class="project-progress">
                <div class="progress-meta">
                  <span>Progresso de Tarefas</span>
                  <strong>{{ getProjectProgress(p.id) }}% ({{ getProjectTaskCount(p.id) }} itens)</strong>
                </div>
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    [style.width.%]="getProjectProgress(p.id)"
                    [style.background]="p.color"
                  ></div>
                </div>
              </div>

              <div class="project-meta-row">
                <div class="owner-info">
                  <span class="avatar">{{ getUserInitials(p.ownerId) }}</span>
                  <div>
                    <small>Responsável</small>
                    <strong>{{ getUserName(p.ownerId) }}</strong>
                  </div>
                </div>
                <div class="dates-info">
                  <small>Período</small>
                  <strong>{{ p.startDate }} → {{ p.endDate }}</strong>
                </div>
              </div>

              <div class="project-actions">
                <button type="button" class="btn btn-secondary btn-sm" (click)="viewDetails(p)">
                  Detalhes
                </button>
                <button type="button" class="btn btn-secondary btn-sm" (click)="openEditModal(p)">
                  Editar
                </button>
                <button
                  type="button"
                  class="btn btn-danger btn-sm ml-auto"
                  (click)="confirmDelete(p)"
                >
                  Excluir
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Project Detail View -->
        <div class="project-detail-view">
          <div class="detail-nav">
            <button type="button" class="btn btn-secondary" (click)="goBackFromDetails()">
              ← Voltar para Projetos
            </button>
            <div class="detail-nav-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="openEditModal(selectedProject)"
              >
                Editar Projeto
              </button>
            </div>
          </div>

          <div class="card detail-hero-card">
            <div class="detail-hero-top">
              <div>
                <span class="mono detail-code">{{ selectedProject.code }}</span>
                <h2>{{ selectedProject.name }}</h2>
              </div>
              <span class="badge" [ngClass]="getStatusClass(selectedProject.status)">
                {{ formatProjectStatus(selectedProject.status) }}
              </span>
            </div>
            <p class="detail-description">{{ selectedProject.description }}</p>

            <div class="detail-stats-strip">
              <div class="stat-item">
                <small>Responsável Técnico</small>
                <strong>{{ getUserName(selectedProject.ownerId) }}</strong>
              </div>
              <div class="stat-item">
                <small>Data de Início</small>
                <strong>{{ selectedProject.startDate }}</strong>
              </div>
              <div class="stat-item">
                <small>Previsão de Conclusão</small>
                <strong>{{ selectedProject.endDate }}</strong>
              </div>
              <div class="stat-item">
                <small>Taxa de Conclusão</small>
                <strong>{{ getProjectProgress(selectedProject.id) }}%</strong>
              </div>
            </div>
          </div>

          <div class="card detail-tasks-card">
            <div class="card-head">
              <h3>Tarefas Vinculadas ao Projeto ({{ getProjectTasks(selectedProject.id).length }})</h3>
            </div>
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Responsável</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of getProjectTasks(selectedProject.id); track t.id) {
                    <tr>
                      <td class="mono">{{ t.code }}</td>
                      <td>{{ t.title }}</td>
                      <td>{{ getUserName(t.assigneeId) }}</td>
                      <td>
                        <span class="badge" [ngClass]="'badge-prio-' + t.priority">
                          {{ t.priority | uppercase }}
                        </span>
                      </td>
                      <td>
                        <span class="badge" [ngClass]="'badge-status-' + t.status">
                          {{ formatTaskStatus(t.status) }}
                        </span>
                      </td>
                      <td>{{ t.dueDate }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Create / Edit Project Modal (Intentionally non-responsive width for BUG-11) -->
      @if (showModal) {
        <div class="modal-backdrop" (click)="showModal = false">
          <div class="modal-panel project-wide-modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingProjectId ? 'Editar Projeto' : 'Novo Projeto Corporativo' }}</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="showModal = false">
                ✕
              </button>
            </div>
            <form [formGroup]="projectForm" (ngSubmit)="saveProject()">
              <div class="modal-body">
                <div class="form-row-code">
                  <div class="form-group">
                    <label>Código / Sigla *</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="code"
                      placeholder="Ex: TF-OPS"
                    />
                  </div>
                  <div class="form-group">
                    <label>Nome do Projeto *</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="name"
                      placeholder="Nome comercial ou técnico da iniciativa"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Descrição e Escopo Executivo *</label>
                  <textarea
                    class="form-control"
                    formControlName="description"
                    placeholder="Descreva os entregáveis e objetivos estratégicos do projeto..."
                  ></textarea>
                </div>

                <div class="form-row-4">
                  <div class="form-group">
                    <label>Responsável *</label>
                    <select class="form-control" formControlName="ownerId">
                      @for (u of users; track u.id) {
                        <option [value]="u.id">{{ u.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Status *</label>
                    <select class="form-control" formControlName="status">
                      <option value="planning">Em planejamento</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="on_hold">Em pausa</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Data de Início *</label>
                    <input type="date" class="form-control" formControlName="startDate" />
                  </div>
                  <div class="form-group">
                    <label>Data de Conclusão *</label>
                    <input type="date" class="form-control" formControlName="endDate" />
                  </div>
                </div>
              </div>

              <div class="modal-footer project-modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showModal = false">
                  Cancelar Operação
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="projectForm.invalid"
                >
                  {{ editingProjectId ? 'Salvar Alterações no Projeto' : 'Confirmar e Criar Projeto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (projectToDelete) {
        <div class="modal-backdrop" (click)="projectToDelete = null">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Confirmar Exclusão de Projeto</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="projectToDelete = null">
                ✕
              </button>
            </div>
            <div class="modal-body">
              <p>
                Tem certeza que deseja excluir permanentemente o projeto
                <strong>{{ projectToDelete.name }}</strong> ({{ projectToDelete.code }})?
              </p>
              <p class="text-muted mt-2">
                Esta operação removerá o projeto da listagem ativa do workspace.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="projectToDelete = null">
                Cancelar
              </button>
              <button type="button" class="btn btn-danger" (click)="executeDelete()">
                Confirmar Exclusão
              </button>
            </div>
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

      .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 20px;
      }

      .project-card {
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;

        &:hover {
          box-shadow: var(--shadow-md);
        }
      }

      .project-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .code-pill {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11.5px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
        border: 1.5px solid;
      }

      .project-title {
        font-size: 16.5px;
        font-weight: 700;
        color: var(--text-primary);
        cursor: pointer;

        &:hover {
          color: var(--brand-primary);
        }
      }

      .project-desc {
        font-size: 13px;
        color: var(--text-secondary);
        line-height: 1.55;
        flex: 1;
      }

      .project-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .progress-meta {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .progress-bar-bg {
          height: 7px;
          background: #f1f5f9;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 999px;
        }
      }

      .project-meta-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        font-size: 12px;

        .owner-info {
          display: flex;
          align-items: center;
          gap: 8px;

          small {
            display: block;
            color: var(--text-muted);
            font-size: 11px;
          }
          strong {
            color: var(--text-primary);
          }
        }

        .dates-info {
          text-align: right;
          small {
            display: block;
            color: var(--text-muted);
            font-size: 11px;
          }
          strong {
            color: var(--text-secondary);
          }
        }
      }

      .project-actions {
        display: flex;
        gap: 8px;
        padding-top: 8px;
      }

      .ml-auto {
        margin-left: auto;
      }

      /* Detail View */
      .detail-nav {
        display: flex;
        justify-content: space-between;
        margin-bottom: 18px;
      }

      .detail-hero-card {
        padding: 26px;
        margin-bottom: 20px;

        .detail-hero-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .detail-code {
          font-size: 12px;
          color: var(--brand-primary);
          font-weight: 700;
        }

        h2 {
          font-size: 22px;
          font-weight: 700;
          margin-top: 2px;
        }

        .detail-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 22px;
          max-width: 820px;
        }
      }

      .detail-stats-strip {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding-top: 18px;
        border-top: 1px solid var(--border-color);

        .stat-item {
          small {
            display: block;
            font-size: 11.5px;
            color: var(--text-muted);
            margin-bottom: 3px;
          }
          strong {
            font-size: 14px;
            color: var(--text-primary);
          }
        }
      }

      .detail-tasks-card {
        .card-head {
          padding: 18px 20px;
          border-bottom: 1px solid var(--border-color);
          h3 {
            font-size: 15px;
            font-weight: 600;
          }
        }
      }

      /* Fixed wide modal (BUG-11 on mobile viewports) */
      .project-wide-modal {
        width: 840px;
        min-width: 840px;
        max-width: none;
      }

      .form-row-code {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 14px;
      }

      .form-row-4 {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }

      .project-modal-footer {
        padding-left: 340px;
      }

      .text-muted {
        color: var(--text-muted);
      }

      .mt-2 {
        margin-top: 8px;
      }
    `,
  ],
})
export class ProjectsComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private router = inject(Router);

  projects: Project[] = [];
  tasks: TaskItem[] = [];
  users: User[] = [];

  selectedProject: Project | null = null;
  showModal = false;
  editingProjectId: string | null = null;
  projectToDelete: Project | null = null;

  projectForm = this.fb.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    ownerId: ['usr-1', [Validators.required]],
    status: ['in_progress', [Validators.required]],
    startDate: ['2026-11-01', [Validators.required]],
    endDate: ['2027-01-30', [Validators.required]],
  });

  ngOnInit(): void {
    this.users = this.store.getUsersSnapshot();
    this.store.projects$.subscribe((list) => {
      this.projects = list;
      if (this.selectedProject) {
        this.selectedProject =
          list.find((p) => p.id === this.selectedProject?.id) || null;
      }
    });
    this.store.tasks$.subscribe((t) => (this.tasks = t));
  }

  getProjectTasks(projectId: string): TaskItem[] {
    return this.tasks.filter((t) => t.projectId === projectId);
  }

  getProjectTaskCount(projectId: string): number {
    return this.getProjectTasks(projectId).length;
  }

  getProjectProgress(projectId: string): number {
    const list = this.getProjectTasks(projectId);
    if (!list.length) return 0;
    const done = list.filter((t) => t.status === 'done').length;
    return Math.round((done / list.length) * 100);
  }

  getUserName(id: string): string {
    return this.users.find((u) => u.id === id)?.name || 'Não definido';
  }

  getUserInitials(id: string): string {
    return this.users.find((u) => u.id === id)?.avatar || 'TF';
  }

  formatProjectStatus(status: ProjectStatus): string {
    const map: Record<ProjectStatus, string> = {
      planning: 'Em planejamento',
      in_progress: 'Em andamento',
      on_hold: 'Em pausa',
      completed: 'Concluído',
    };
    return map[status] || status;
  }

  getStatusClass(status: ProjectStatus): string {
    const map: Record<ProjectStatus, string> = {
      planning: 'badge-status-todo',
      in_progress: 'badge-status-in_progress',
      on_hold: 'badge-status-in_review',
      completed: 'badge-status-done',
    };
    return map[status] || 'badge-status-todo';
  }

  formatTaskStatus(status: string): string {
    const map: Record<string, string> = {
      todo: 'A fazer',
      in_progress: 'Em andamento',
      in_review: 'Em revisão',
      done: 'Concluída',
    };
    return map[status] || status;
  }

  viewDetails(project: Project): void {
    this.selectedProject = project;
  }

  goBackFromDetails(): void {
    this.router.navigate(['/reports']);
  }

  openCreateModal(): void {
    this.editingProjectId = null;
    this.projectForm.reset({
      code: 'TF-NEW',
      name: '',
      description: '',
      ownerId: 'usr-1',
      status: 'planning',
      startDate: '2026-11-11',
      endDate: '2027-02-15',
    });
    this.showModal = true;
  }

  openEditModal(project: Project): void {
    this.editingProjectId = project.id;
    this.projectForm.patchValue({
      code: project.code,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    });
    this.showModal = true;
  }

  saveProject(): void {
    if (this.projectForm.invalid) return;
    const val = this.projectForm.value;
    const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6'];
    const randomColor = colors[this.projects.length % colors.length];

    if (this.editingProjectId) {
      this.store.updateProject(this.editingProjectId, {
        code: val.code || 'TF',
        name: val.name || '',
        description: val.description || '',
        ownerId: val.ownerId || 'usr-1',
        status: (val.status as ProjectStatus) || 'planning',
        startDate: val.startDate || '',
        endDate: val.endDate || '',
      });
      this.toast.show('Projeto atualizado', 'As alterações foram salvas com sucesso.');
    } else {
      this.store.addProject({
        code: val.code || 'TF',
        name: val.name || '',
        description: val.description || '',
        ownerId: val.ownerId || 'usr-1',
        status: (val.status as ProjectStatus) || 'planning',
        startDate: val.startDate || '',
        endDate: val.endDate || '',
        color: randomColor,
      });
      this.toast.show('Projeto criado', 'O novo projeto foi adicionado ao portfólio.');
    }
    this.showModal = false;
  }

  confirmDelete(project: Project): void {
    this.projectToDelete = project;
  }

  executeDelete(): void {
    if (!this.projectToDelete) return;
    this.store.deleteProject(this.projectToDelete.id);
    this.toast.show(
      'Projeto removido',
      `O projeto "${this.projectToDelete.name}" foi excluído com sucesso.`
    );
    this.projectToDelete = null;
  }
}

