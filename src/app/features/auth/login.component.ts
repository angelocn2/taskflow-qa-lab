import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="brand-header">
          <div class="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="brand-name">TaskFlow</span>
          <span class="brand-tag">ENTERPRISE</span>
        </div>

        <div class="hero-copy">
          <h1>Orquestração de engenharia, produto e operações em escala.</h1>
          <p>
            Planeje sprints, acompanhe indicadores executivos em tempo real, gerencie riscos de
            entrega e mantenha todas as squads sincronizadas em um único workspace.
          </p>

          <div class="feature-pills">
            <div class="pill">
              <span class="dot"></span> Quadros Kanban & Fluxos Ágeis
            </div>
            <div class="pill">
              <span class="dot"></span> Governança de Prazos & SLAs
            </div>
            <div class="pill">
              <span class="dot"></span> Relatórios Executivos de Produtividade
            </div>
          </div>
        </div>

        <div class="auth-footer-meta">
          <span>TaskFlow Cloud v3.8.4-rc2 (Ambiente de Homologação)</span>
          <span>© 2026 TaskFlow Inc.</span>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          @if (!recoveryMode) {
            <div class="auth-card-header">
              <h2>Acesse sua conta</h2>
              <p>Insira suas credenciais corporativas para continuar no workspace.</p>
            </div>

            @if (errorMessage) {
              <div class="alert-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{{ errorMessage }}</span>
              </div>
            }

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="email">E-mail corporativo</label>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  formControlName="email"
                  placeholder="nome@taskflow.io"
                  autocomplete="username"
                />
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label for="password">Senha</label>
                  <button type="button" class="link-btn" (click)="toggleRecovery(true)">
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  class="form-control"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
              </div>

              <button type="submit" class="btn btn-primary btn-block">
                Entrar no Workspace
              </button>
            </form>

            <div class="quick-profiles">
              <div class="divider">
                <span>Acesso Rápido — Perfis de Homologação</span>
              </div>
              <div class="profile-grid">
                <button
                  type="button"
                  class="profile-chip"
                  (click)="fillCredentials('admin@taskflow.io', 'Admin@123')"
                >
                  <span class="role-dot admin"></span>
                  <div class="chip-info">
                    <strong>Administrador</strong>
                    <small>admin&#64;taskflow.io</small>
                  </div>
                </button>

                <button
                  type="button"
                  class="profile-chip"
                  (click)="fillCredentials('gerente@taskflow.io', 'Gerente@123')"
                >
                  <span class="role-dot manager"></span>
                  <div class="chip-info">
                    <strong>Gerente</strong>
                    <small>gerente&#64;taskflow.io</small>
                  </div>
                </button>

                <button
                  type="button"
                  class="profile-chip"
                  (click)="fillCredentials('colaborador@taskflow.io', 'Colab@123')"
                >
                  <span class="role-dot collab"></span>
                  <div class="chip-info">
                    <strong>Colaborador</strong>
                    <small>colaborador&#64;taskflow.io</small>
                  </div>
                </button>
              </div>
            </div>
          } @else {
            <div class="auth-card-header">
              <h2>Recuperação de senha</h2>
              <p>Informe seu e-mail corporativo para receber o link temporário de redefinição.</p>
            </div>

            @if (recoveryMessage) {
              <div [class]="recoverySuccess ? 'alert-success' : 'alert-error'">
                <span>{{ recoveryMessage }}</span>
              </div>
            }

            <form [formGroup]="recoveryForm" (ngSubmit)="onRecover()">
              <div class="form-group">
                <label for="rec-email">E-mail cadastrado</label>
                <input
                  id="rec-email"
                  type="text"
                  class="form-control"
                  formControlName="email"
                  placeholder="seu.email@taskflow.io"
                />
              </div>

              <button type="submit" class="btn btn-primary btn-block">
                Enviar link de recuperação
              </button>

              <button
                type="button"
                class="btn btn-secondary btn-block mt-2"
                (click)="toggleRecovery(false)"
              >
                Voltar para o login
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1.05fr 0.95fr;
        background: #ffffff;
      }

      .auth-left {
        background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
        color: #ffffff;
        padding: 48px 56px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .brand-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .brand-logo {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: #4f46e5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.5);
      }

      .brand-name {
        font-size: 20px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .brand-tag {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        color: #c7d2fe;
        letter-spacing: 0.06em;
      }

      .hero-copy {
        max-width: 520px;

        h1 {
          font-size: 34px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.025em;
          margin-bottom: 18px;
          color: #f8fafc;
        }

        p {
          font-size: 15.5px;
          color: #cbd5e1;
          line-height: 1.65;
          margin-bottom: 28px;
        }
      }

      .feature-pills {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 9px 14px;
          border-radius: 8px;
          width: fit-content;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #818cf8;
        }
      }

      .auth-footer-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 20px;
      }

      .auth-right {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 28px;
        background: #f8fafc;
      }

      .auth-card {
        width: 100%;
        max-width: 430px;
        background: #ffffff;
        border: 1px solid var(--border-color);
        border-radius: 14px;
        padding: 34px 32px;
        box-shadow: var(--shadow-md);
      }

      .auth-card-header {
        margin-bottom: 24px;

        h2 {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        p {
          font-size: 13.5px;
          color: var(--text-secondary);
        }
      }

      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .link-btn {
        background: none;
        border: none;
        color: var(--brand-primary);
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }

      .btn-block {
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        margin-top: 6px;
      }

      .mt-2 {
        margin-top: 10px;
      }

      .alert-error {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        font-size: 12.5px;
        margin-bottom: 16px;
        word-break: break-word;
      }

      .alert-success {
        padding: 11px 12px;
        border-radius: 8px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #047857;
        font-size: 13px;
        margin-bottom: 16px;
      }

      .quick-profiles {
        margin-top: 26px;
      }

      .divider {
        position: relative;
        text-align: center;
        margin-bottom: 14px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: var(--border-color);
        }

        span {
          position: relative;
          background: #ffffff;
          padding: 0 10px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      }

      .profile-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .profile-chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: #f8fafc;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;

        &:hover {
          border-color: var(--brand-primary);
          background: #eef2ff;
        }

        .chip-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;

          strong {
            font-size: 13px;
            color: var(--text-primary);
          }

          small {
            font-size: 12px;
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
          }
        }
      }

      .role-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        flex-shrink: 0;

        &.admin {
          background: #4f46e5;
        }
        &.manager {
          background: #0ea5e9;
        }
        &.collab {
          background: #10b981;
        }
      }

      @media (max-width: 900px) {
        .auth-page {
          grid-template-columns: 1fr;
        }
        .auth-left {
          display: none;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  recoveryMode = false;
  errorMessage = '';
  recoveryMessage = '';
  recoverySuccess = false;

  loginForm = this.fb.group({
    email: ['admin@taskflow.io', [Validators.required]],
    password: ['Admin@123', [Validators.required]],
  });

  recoveryForm = this.fb.group({
    email: ['', [Validators.required]],
  });

  fillCredentials(email: string, password: string): void {
    this.errorMessage = '';
    this.loginForm.patchValue({ email, password });
  }

  toggleRecovery(state: boolean): void {
    this.recoveryMode = state;
    this.errorMessage = '';
    this.recoveryMessage = '';
  }

  onSubmit(): void {
    const { email, password } = this.loginForm.value;
    const result = this.auth.login(email || '', password || '');
    if (result.success) {
      this.toast.show(
        'Sessão iniciada',
        `Bem-vindo(a), ${this.auth.currentUser?.name}!`,
        'success'
      );
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = result.error || 'Falha na autenticação.';
    }
  }

  onRecover(): void {
    const email = this.recoveryForm.value.email || '';
    const res = this.auth.recoverPassword(email);
    this.recoverySuccess = res.success;
    this.recoveryMessage = res.message;
  }
}

