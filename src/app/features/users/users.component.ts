import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User, UserRole } from '../../core/models/models';
import { TaskflowStoreService } from '../../core/services/taskflow-store.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1>Gestão de Usuários & Controle de Acesso</h1>
          <p>Administre membros do workspace, cargos, departamentos e perfis de permissão RBAC.</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          + Cadastrar Usuário
        </button>
      </div>

      <!-- Summary Strip -->
      <div class="user-summary-grid">
        <div class="card summary-box">
          <span>Total de Membros</span>
          <strong>{{ users.length }}</strong>
        </div>
        <div class="card summary-box">
          <span>Contas Ativas</span>
          <strong class="text-emerald">{{ activeUsersCount }}</strong>
        </div>
        <div class="card summary-box">
          <span>Administradores</span>
          <strong>{{ adminUsersCount }}</strong>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail Corporativo</th>
                <th>Departamento / Cargo</th>
                <th>Perfil de Acesso</th>
                <th>Status da Conta</th>
                <th>Ações Administrativas</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users; track u.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <span class="avatar">{{ u.avatar }}</span>
                      <div>
                        <strong class="user-fullname">{{ u.name }}</strong>
                        <small class="mono user-id">{{ u.id }}</small>
                      </div>
                    </div>
                  </td>
                  <td class="mono">{{ u.email }}</td>
                  <td>
                    <div class="dept-cell">
                      <strong>{{ u.jobTitle }}</strong>
                      <small>{{ u.department }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="role-badge" [attr.data-role]="u.role">
                      {{ formatRole(u.role) }}
                    </span>
                  </td>
                  <td>
                    <span
                      class="badge"
                      [ngClass]="u.active ? 'badge-status-done' : 'badge-prio-critica'"
                    >
                      {{ u.active ? 'Ativo' : 'Desativado' }}
                    </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        (click)="openEditModal(u)"
                      >
                        Editar / Permissões
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm"
                        [ngClass]="u.active ? 'btn-danger' : 'btn-secondary'"
                        (click)="toggleStatus(u)"
                      >
                        {{ u.active ? 'Desativar' : 'Ativar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create / Edit User Modal -->
      @if (showModal) {
        <div class="modal-backdrop" (click)="showModal = false">
          <div class="modal-panel" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingUserId ? 'Editar Usuário e Permissões' : 'Novo Usuário do Workspace' }}</h3>
              <button type="button" class="btn btn-ghost btn-sm" (click)="showModal = false">
                ✕
              </button>
            </div>
            <form [formGroup]="userForm" (ngSubmit)="saveUser()">
              <div class="modal-body">
                <div class="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="name"
                    placeholder="Ex: Camila Rocha"
                  />
                </div>

                <div class="form-group">
                  <label>E-mail Corporativo *</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="email"
                    placeholder="camila.rocha@taskflow.io"
                  />
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label>Cargo *</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="jobTitle"
                      placeholder="Ex: QA Lead / Product Manager"
                    />
                  </div>

                  <div class="form-group">
                    <label>Departamento *</label>
                    <input
                      type="text"
                      class="form-control"
                      formControlName="department"
                      placeholder="Ex: Qualidade & Governança"
                    />
                  </div>
                </div>

                <div class="form-row-2">
                  <div class="form-group">
                    <label>Perfil de Acesso (Role) *</label>
                    <select class="form-control" formControlName="role">
                      <option value="admin">Administrador (Acesso Total)</option>
                      <option value="manager">Gerente (Gestão de Projetos e Squads)</option>
                      <option value="collaborator">Colaborador (Operação de Tarefas)</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Senha Inicial</label>
                    <input
                      type="password"
                      class="form-control"
                      formControlName="password"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showModal = false">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
                  {{ editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário' }}
                </button>
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

      .user-summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 20px;

        .summary-box {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          span {
            font-size: 13px;
            color: var(--text-secondary);
            font-weight: 500;
          }

          strong {
            font-size: 24px;
            font-weight: 700;
          }
        }
      }

      .text-emerald {
        color: #059669;
      }

      .user-cell {
        display: flex;
        align-items: center;
        gap: 10px;

        .user-fullname {
          display: block;
          font-size: 13.5px;
          color: var(--text-primary);
        }

        .user-id {
          font-size: 11px;
          color: var(--text-muted);
        }
      }

      .dept-cell {
        strong {
          display: block;
          font-size: 13px;
          font-weight: 500;
        }
        small {
          font-size: 11.5px;
          color: var(--text-muted);
        }
      }

      .role-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;

        &[data-role='admin'] {
          background: #eef2ff;
          color: #4f46e5;
        }
        &[data-role='manager'] {
          background: #e0f2fe;
          color: #0284c7;
        }
        &[data-role='collaborator'] {
          background: #f1f5f9;
          color: #475569;
        }
      }

      .action-buttons {
        display: flex;
        gap: 8px;
      }

      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
    `,
  ],
})
export class UsersComponent implements OnInit {
  private store = inject(TaskflowStoreService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  users: User[] = [];
  showModal = false;
  editingUserId: string | null = null;

  userForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required]],
    jobTitle: ['', [Validators.required]],
    department: ['', [Validators.required]],
    role: ['collaborator', [Validators.required]],
    password: ['Task@123'],
  });

  ngOnInit(): void {
    this.store.users$.subscribe((list) => (this.users = list));
  }

  get activeUsersCount(): number {
    return this.users.filter((u) => u.active).length;
  }

  get adminUsersCount(): number {
    return this.users.filter((u) => u.role === 'admin').length;
  }

  formatRole(role: UserRole): string {
    const map: Record<UserRole, string> = {
      admin: 'Administrador',
      manager: 'Gerente',
      collaborator: 'Colaborador',
    };
    return map[role] || role;
  }

  openCreateModal(): void {
    this.editingUserId = null;
    this.userForm.reset({
      name: '',
      email: '',
      jobTitle: '',
      department: '',
      role: 'collaborator',
      password: 'Task@123',
    });
    this.showModal = true;
  }

  openEditModal(user: User): void {
    this.editingUserId = user.id;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
      department: user.department,
      role: user.role,
      password: user.password || 'Task@123',
    });
    this.showModal = true;
  }

  saveUser(): void {
    if (this.userForm.invalid) return;
    const val = this.userForm.value;

    if (this.editingUserId) {
      this.store.updateUser(this.editingUserId, {
        name: val.name || '',
        email: val.email || '',
        jobTitle: val.jobTitle || '',
        department: val.department || '',
        role: (val.role as UserRole) || 'collaborator',
      });
      this.toast.show(
        'Usuário atualizado',
        'Os dados e permissões do usuário foram atualizados.'
      );
    } else {
      this.store.addUser({
        name: val.name || '',
        email: val.email || '',
        jobTitle: val.jobTitle || '',
        department: val.department || '',
        role: (val.role as UserRole) || 'collaborator',
        password: val.password || 'Task@123',
        active: true,
      });
      this.toast.show('Usuário cadastrado', 'Novo membro adicionado ao workspace.');
    }

    this.showModal = false;
  }

  toggleStatus(user: User): void {
    this.store.toggleUserActive(user.id);
    this.toast.show(
      user.active ? 'Conta desativada' : 'Conta reativada',
      `O status de acesso de ${user.name} foi alterado.`
    );
  }
}

