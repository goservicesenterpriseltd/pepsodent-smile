import { makeAutoObservable } from 'mobx';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // in milliseconds, default 5000
}

class ToastStore {
  toasts: Toast[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  show(message: string, type: ToastType = 'error', duration = 5000) {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    
    this.toasts.push(toast);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  clear() {
    this.toasts = [];
  }

  // Convenience methods
  error(message: string, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  warning(message: string, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  info(message: string, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  success(message: string, duration = 3000) {
    return this.show(message, 'success', duration);
  }
}

export const toastStore = new ToastStore();

