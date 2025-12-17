import { makeAutoObservable } from 'mobx';
import type { UserData } from '@/types/user';

class UserStore {
  user: UserData | null = null;

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  updateUser(userData: UserData) {
    this.user = userData;
    this.saveToStorage();
  }

  get isComplete(): boolean {
    return !!(
      this.user?.firstName &&
      this.user?.lastName &&
      this.user?.phone &&
      this.user?.email &&
      this.user?.gender
    );
  }

  get fullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`.trim();
  }

  clearUser() {
    this.user = null;
    this.saveToStorage();
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      if (this.user) {
        localStorage.setItem('pepsodent_user', JSON.stringify(this.user));
      } else {
        localStorage.removeItem('pepsodent_user');
      }
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pepsodent_user');
      if (stored) {
        try {
          this.user = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load user from storage:', e);
        }
      }
    }
  }
}

export const userStore = new UserStore();

