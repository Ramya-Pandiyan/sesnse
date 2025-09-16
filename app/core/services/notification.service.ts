import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  showSuccess(message: string, duration = 3000): void {
    this.showToast('success', message, duration);
  }

  showError(message: string, duration = 5000): void {
    this.showToast('error', message, duration);
  }

  showWarning(message: string, duration = 4000): void {
    this.showToast('warning', message, duration);
  }

  showInfo(message: string, duration = 3000): void {
    this.showToast('info', message, duration);
  }

  private showToast(type: Toast['type'], message: string, duration: number): void {
    const id = this.generateId();
    const toast: Toast = { id, type, message, duration };
    
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);

    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== id);
    this.toastsSubject.next(filteredToasts);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}