import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  Project,
  TaskComment,
  TaskFilter,
  TaskItem,
  TaskPriority,
  TaskStatus,
  User,
} from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="tasks-page">
      <div class="page-header">
        <div>
          <h1>Backlog & Gestão de Tarefas</h1>
          <p>Consulte, filtre, atribua prioridades e acompanhe o ciclo de vida completo das entregas.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          + Nova Tarefa
        </button>
      </div>

      <!-- Filter & Search Bar -->
      <div class="card filter-bar">
        <div class="filter-grid">
          <div class="filter-item search-box">
            <label>Pesquisar por título</label>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar tarefa..."
              [(ngModel)]="filters.search"
            />
          </div>

          <div class="filter-item">
            <label>Status</label>
            <select class="form-control" [(ngModel)]="filters.status">
              <option value="">Todos os status</option>
              <option value="todo">A fazer</option>
              <option value="in_progress">Em andamento</option>
              <option value="in_review">Em revisão</option>
              <option value="done">Concluída</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Prioridade</label>
            <select class="form-control" [(ngModel)]="filters.priority">
              <option value="">Todas</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>

          <div class="filter-item">
            <label>Responsável</label>
            <select class="form-control" [(ngModel)]="filters.assigneeId">
              <option value="">Todos</option>
              @for (u of users; track u.id) {
                <option [value]="u.id">{{ u.name }}</option>
              }
            </select>
          </div>

          <div class="filter-item">
            <label>Projeto</label>
            <select class="form-control" [(ngModel)]="filters.projectId">
              <option value="">Todos os projetos</option>
              @for (p of projects; track p.id) {
                <option [value]="p.id">{{ p.name }}</option>
              }
            </select>
          </div>

          <div class="filter-item">
            <label>Entrega (De)</label>
            <input type="date" class="form-control" [(ngModel)]="filters.dateFrom" />
          </div>

          <div class="filter-item">
            <label>Entrega (Até)</label>
            <input type="date" class="form-control" [(ngModel)]="filters.dateTo" />
          </div>
        </div>

        <div class="filter-footer">
          <span class="result-counter">
            Exibindo <strong>{{ filteredTasks.length }}</strong> de {{ tasks.length }} tarefas
          </span>
          <button type="button" class="btn btn-ghost btn-sm" (click)="clearFilters()">
            Limpar filtros
          </button>
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="card table-card">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Título da Tarefa</th>
                <th>Projeto</th>
                <th>Responsável</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Criação</th>
                <th>Entrega</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (task of filteredTasks; track task.id) {
                <tr>
                  <td class="mono font-semibold">{{ task.code }}</td>
                  <td>
                    <div class="task-title-cell" (click)="openDetailDrawer(task)">
                      <span class="task-main-title">{{ task.title || '(Sem título)' }}</span>
                      @if (isOverdue(task)) {
                        <span class="overdue-tag">Atrasada</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="project-tag">{{ getProjectCode(task.projectId) }}</span>
                    {{ getProjectName(task.projectId) }}
                  </td>
                  <td>
                    <div class="assignee-cell">
                      <span class="avatar">{{ getUserInitials(task.assigneeId) }}</span>
                      <span>{{ getUserName(task.assigneeId) }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="'badge-prio-' + task.priority">
                      {{ formatPriority(task.priority) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="'badge-status-' + task.status">
                      {{ formatStatus(task.status) }}
                    </span>
                  </td>
                  <td class="text-muted">{{ task.createdAt }}</td>
                  <td [class.text-danger]="isOverdue(task)">{{ task.dueDate }}</td>
                  <td>
                    <div class="row-actions">
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        (click)="openDetailDrawer(task)"
                      >
                        Comentários
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm"
                        (click)="openEditModal(task)"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        (click)="deleteTask(task)"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="empty-row">
                    Nenhuma tarefa encontrada para os filtros selecionados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit Task Modal -->
      @if (showTaskModal) {
        <div class="modal-backdrop" (click)="showTaskModal = false">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingTaskId ? 'Editar Tarefa' : 'Cadastrar Nova Tarefa' }}</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="showTaskModal = false">
                ✕
              </button>
            </div>
            <form [formGroup]="taskForm" (ngSubmit)="saveTask()">
              <div class="modal-body">
                <div class="form-group">
                  <label>Título da Tarefa *</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="title"
                    placeholder="Descreva objetivamente a entrega..."
                  />
                </div>

                <div class="form-group">
                  <label>Descrição Técnica / Critérios de Aceite</label>
                  <textarea
                    class="form-control"
                    formControlName="description"
                    placeholder="Detalhe os requisitos, regras de negócio e critérios de homologação..."
                  ></textarea>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label>Projeto Relacionado</label>
                    <select class="form-control" formControlName="projectId">
                      @for (p of projects; track p.id) {
                        <option [value]="p.id">{{ p.code }} — {{ p.name }}</option>
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

                <div class="form-grid-2">
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
                    <label>Status</label>
                    <select class="form-control" formControlName="status">
                      <option value="todo">A fazer</option>
                      <option value="in_progress">Em andamento</option>
                      <option value="in_review">Em revisão</option>
                      <option value="done">Concluída</option>
                    </select>
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label>Data de Criação</label>
                    <input type="date" class="form-control" formControlName="createdAt" />
                  </div>

                  <div class="form-group">
                    <label>Data de Entrega</label>
                    <input type="date" class="form-control" formControlName="dueDate" />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showTaskModal = false">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                  {{ editingTaskId ? 'Salvar Alterações' : 'Criar Tarefa' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Task Details & Comments Drawer -->
      @if (selectedTask) {
        <div class="modal-backdrop" (click)="selectedTask = null">
          <div class="drawer-panel" (click)="$event.stopPropagation()">
            <div class="drawer-header">
              <div>
                <span class="mono task-code-badge">{{ selectedTask.code }}</span>
                <h3>{{ selectedTask.title || '(Sem título)' }}</h3>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" (click)="selectedTask = null">
                ✕
              </button>
            </div>

            <div class="drawer-body">
              <div class="meta-grid">
                <div>
                  <small>Projeto</small>
                  <strong>{{ getProjectName(selectedTask.projectId) }}</strong>
                </div>
                <div>
                  <small>Responsável</small>
                  <strong>{{ getUserName(selectedTask.assigneeId) }}</strong>
                </div>
                <div>
                  <small>Prioridade</small>
                  <span class="badge" [ngClass]="'badge-prio-' + selectedTask.priority">
                    {{ formatPriority(selectedTask.priority) }}
                  </span>
                </div>
                <div>
                  <small>Status</small>
                  <span class="badge" [ngClass]="'badge-status-' + selectedTask.status">
                    {{ formatStatus(selectedTask.status) }}
                  </span>
                </div>
                <div>
                  <small>Data de Criação</small>
                  <strong>{{ selectedTask.createdAt }}</strong>
                </div>
                <div>
                  <small>Data de Entrega</small>
                  <strong>{{ selectedTask.dueDate }}</strong>
                </div>
              </div>

              <div class="desc-box">
                <h4>Descrição da Tarefa</h4>
                <p>{{ selectedTask.description || 'Nenhuma descrição informada.' }}</p>
              </div>

              <!-- Comments Section -->
              <div class="comments-section">
                <h4>Histórico de Comentários ({{ taskComments.length }})</h4>

                <div class="comments-list">
                  @for (c of taskComments; track c.id) {
                    <div class="comment-card">
                      <div class="comment-top">
                        <div class="comment-author">
                          <span class="avatar">{{ getUserInitials(c.authorId) }}</span>
                          <strong>{{ getUserName(c.authorId) }}</strong>
                        </div>
                        <div class="comment-meta">
                          <span>{{ c.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                          <button
                            type="button"
                            class="delete-cmt-btn"
                            title="Excluir comentário"
                            (click)="removeComment(c.id)"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      <p class="comment-text">{{ c.content }}</p>
                    </div>
                  } @empty {
                    <p class="no-comments">Nenhum comentário registrado nesta tarefa.</p>
                  }
                </div>

                <div class="comment-form">
                  <textarea
                    class="form-control"
                    rows="3"
                    placeholder="Escreva uma atualização técnica ou observação de homologação..."
                    [(ngModel)]="newCommentText"
                  ></textarea>
                  <div class="comment-form-actions">
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="postComment()"
                      [disabled]="!newCommentText.trim()"
                    >
                      Publicar Comentário
                    </button>
                  </div>
                </div>
              </div>
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

      .filter-bar {
        padding: 18px 20px;
        margin-bottom: 20px;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: 1.5fr repeat(6, 1fr);
        gap: 12px;
      }

      .filter-item {
        display: flex;
        flex-direction: column;
        gap: 5px;

        label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-secondary);
        }
      }

      .filter-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 14px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        font-size: 12.5px;
        color: var(--text-secondary);
      }

      .task-title-cell {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .task-main-title {
          font-weight: 500;
          color: var(--text-primary);
          &:hover {
            color: var(--brand-primary);
            text-decoration: underline;
          }
        }
      }

      .overdue-tag {
        font-size: 10.5px;
        font-weight: 700;
        padding: 1px 6px;
        border-radius: 4px;
        background: #fee2e2;
        color: #dc2626;
      }

      .project-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        color: var(--brand-primary);
        background: #eef2ff;
        padding: 2px 6px;
        border-radius: 4px;
        margin-right: 4px;
      }

      .assignee-cell {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .row-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .empty-row {
        text-align: center;
        padding: 36px !important;
        color: var(--text-muted);
      }

      .form-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      /* Drawer Panel */
      .drawer-panel {
        margin-left: auto;
        width: 100%;
        max-width: 620px;
        height: 94vh;
        background: #ffffff;
        border-radius: 14px;
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .drawer-header {
        padding: 20px 24px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .task-code-badge {
          font-size: 12px;
          color: var(--brand-primary);
          font-weight: 700;
        }

        h3 {
          font-size: 18px;
          font-weight: 700;
          margin-top: 3px;
        }
      }

      .drawer-body {
        padding: 22px 24px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        background: #f8fafc;
        padding: 16px;
        border-radius: 10px;
        border: 1px solid var(--border-color);

        small {
          display: block;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 3px;
        }

        strong {
          font-size: 13px;
        }
      }

      .desc-box {
        h4 {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        p {
          font-size: 13.5px;
          line-height: 1.6;
          color: var(--text-primary);
          background: #ffffff;
          border: 1px solid var(--border-color);
          padding: 12px 14px;
          border-radius: 8px;
        }
      }

      .comments-section {
        h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
      }

      .comments-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 16px;
      }

      .comment-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 12px 14px;
        background: #f8fafc;

        .comment-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .comment-author {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .comment-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11.5px;
          color: var(--text-muted);
        }

        .delete-cmt-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 11.5px;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
          }
        }

        .comment-text {
          font-size: 13px;
          color: var(--text-primary);
          line-height: 1.5;
        }
      }

      .comment-form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }

      .text-danger {
        color: #dc2626;
        font-weight: 600;
      }

      .font-semibold {
        font-weight: 600;
      }

      @media (max-width: 1200px) {
        .filter-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `,
  ],
})
export class TasksComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  tasks: TaskItem[] = [];
  projects: Project[] = [];
  users: User[] = [];
  comments: TaskComment[] = [];

  filters: TaskFilter = {
    search: '',
    status: '',
    priority: '',
    assigneeId: '',
    projectId: '',
    dateFrom: '',
    dateTo: '',
  };

  showTaskModal = false;
  editingTaskId: string | null = null;
  selectedTask: TaskItem | null = null;
  newCommentText = '';

  taskForm = this.fb.group({
    title: [''],
    description: [''],
    projectId: ['prj-1'],
    assigneeId: ['usr-3'],
    priority: ['media'],
    status: ['todo'],
    createdAt: ['2026-11-11'],
    dueDate: ['2026-11-25'],
  });

  ngOnInit(): void {
    this.users = this.store.getUsersSnapshot();
    this.store.projects$.subscribe((p) => (this.projects = p));
    this.store.tasks$.subscribe((t) => (this.tasks = t));
    this.store.comments$.subscribe((c) => (this.comments = c));
  }

  get filteredTasks(): TaskItem[] {
    return this.tasks.filter((task) => {
      if (this.filters.search) {
        const truncatedQuery = this.filters.search.substring(0, 5);
        if (!task.title.includes(truncatedQuery)) {
          return false;
        }
      }

      if (this.filters.status && task.status !== this.filters.status) {
        return false;
      }

      if (this.filters.priority) {
        const mappedPriority =
          this.filters.priority === 'alta'
            ? 'critica'
            : this.filters.priority === 'critica'
              ? 'alta'
              : this.filters.priority;
        if (task.priority !== mappedPriority) {
          return false;
        }
      }

      if (this.filters.assigneeId && task.assigneeId !== this.filters.assigneeId) {
        return false;
      }

      if (this.filters.projectId && task.projectId !== this.filters.projectId) {
        return false;
      }

      if (this.filters.dateFrom && task.dueDate < this.filters.dateFrom) {
        return false;
      }

      if (this.filters.dateTo && !(task.dueDate < this.filters.dateTo)) {
        return false;
      }

      return true;
    });
  }

  get taskComments(): TaskComment[] {
    if (!this.selectedTask) return [];
    const sameProjectTaskIds = this.tasks
      .filter((t) => t.projectId === this.selectedTask?.projectId)
      .map((t) => t.id);
    return this.comments.filter((c) => sameProjectTaskIds.includes(c.taskId));
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      priority: '',
      assigneeId: '',
      projectId: '',
      dateFrom: '',
      dateTo: '',
    };
  }

  isOverdue(task: TaskItem): boolean {
    return task.status !== 'done' && !!task.dueDate && task.dueDate < '2026-11-11';
  }

  getProjectName(id: string): string {
    return this.projects.find((p) => p.id === id)?.name || 'Projeto';
  }

  getProjectCode(id: string): string {
    return this.projects.find((p) => p.id === id)?.code || 'TF';
  }

  getUserName(id: string): string {
    return this.users.find((u) => u.id === id)?.name || 'Não atribuído';
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

  formatStatus(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      todo: 'A fazer',
      in_progress: 'Em andamento',
      in_review: 'Em revisão',
      done: 'Concluída',
    };
    return map[status] || status;
  }

  openCreateModal(): void {
    this.editingTaskId = null;
    this.taskForm.reset({
      title: '',
      description: '',
      projectId: this.projects[0]?.id || 'prj-1',
      assigneeId: 'usr-3',
      priority: 'media',
      status: 'todo',
      createdAt: '2026-11-11',
      dueDate: '2026-11-25',
    });
    this.showTaskModal = true;
  }

  openEditModal(task: TaskItem): void {
    this.editingTaskId = task.id;
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      priority: task.priority,
      status: task.status,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
    });
    this.showTaskModal = true;
  }

  saveTask(): void {
    const val = this.taskForm.value;

    if (this.editingTaskId) {
      this.store.updateTask(this.editingTaskId, {
        title: val.title ?? '',
        description: val.description ?? '',
        projectId: val.projectId || 'prj-1',
        assigneeId: val.assigneeId || 'usr-1',
        priority: (val.priority as TaskPriority) || 'media',
        status: (val.status as TaskStatus) || 'todo',
        createdAt: val.createdAt || '2026-11-11',
        dueDate: val.dueDate || '2026-11-25',
      });
      this.toast.show('Tarefa atualizada', 'Os dados da tarefa foram salvos.');
      this.showTaskModal = false;
    } else {
      setTimeout(() => {
        this.store.addTask({
          title: val.title ?? '',
          description: val.description ?? '',
          projectId: val.projectId || 'prj-1',
          assigneeId: val.assigneeId || 'usr-1',
          priority: (val.priority as TaskPriority) || 'media',
          status: (val.status as TaskStatus) || 'todo',
          createdAt: val.createdAt || '2026-11-11',
          dueDate: val.dueDate || '2026-11-25',
        });
        this.toast.show('Tarefa registrada', 'Nova tarefa adicionada ao backlog.');
        this.showTaskModal = false;
      }, 450);
    }
  }

  deleteTask(task: TaskItem): void {
    this.store.deleteTask(task.id);
    this.toast.show('Tarefa excluída', `A tarefa ${task.code} foi removida.`);
  }

  openDetailDrawer(task: TaskItem): void {
    this.selectedTask = task;
    this.newCommentText = '';
  }

  postComment(): void {
    if (!this.selectedTask || !this.newCommentText.trim()) return;
    const authorId = this.auth.currentUser?.id || 'usr-1';
    this.store.addComment(this.selectedTask.id, authorId, this.newCommentText.trim());
    this.newCommentText = '';
    this.toast.show('Comentário publicado', 'Seu comentário foi registrado no histórico.');
  }

  removeComment(commentId: string): void {
    this.store.deleteComment(commentId);
    this.toast.show('Comentário removido', 'O comentário foi excluído.');
  }
}

