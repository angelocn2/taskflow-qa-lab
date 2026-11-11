import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    duration = 4000
  ): void {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const toast: ToastMessage = { id, type, title, message };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  dismiss(id: string): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t.id !== id));
  }
}

