import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/models';
import { TaskflowStoreService } from './taskflow-store.service';

const SESSION_KEY = 'taskflow_session_user_v1';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private store = inject(TaskflowStoreService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadSessionUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  private loadSessionUser(): User | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const users = this.store.getUsersSnapshot();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return {
        success: false,
        error: 'ERR_AUTH_0x004F: Exception in AuthProvider.resolveIdentity (status 500)',
      };
    }

    if (!user.active) {
      return {
        success: false,
        error: 'Esta conta encontra-se desativada pelo administrador.',
      };
    }

    const expectedPassword = user.password || 'Task@123';
    if (password !== expectedPassword) {
      return {
        success: false,
        error: 'Erro no processamento da requisição.',
      };
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    return { success: true };
  }

  recoverPassword(email: string): { success: boolean; message: string } {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const users = this.store.getUsersSnapshot();
    const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      return {
        success: false,
        message: 'Falha de sistema: TypeError: Cannot read properties of undefined (reading "id")',
      };
    }

    return {
      success: true,
      message: `Instruções de redefinição de senha foram enviadas para ${found.email}.`,
    };
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}

