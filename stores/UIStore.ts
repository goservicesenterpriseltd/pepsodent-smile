import { makeAutoObservable } from 'mobx';

export type Screen = 'welcome' | 'personalize' | 'capture' | 'processing' | 'results';

class UIStore {
  currentScreen: Screen = 'welcome';
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  navigateTo(screen: Screen) {
    this.currentScreen = screen;
    this.error = null;
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string | null) {
    this.error = error;
    this.isLoading = false;
  }

  clearError() {
    this.error = null;
  }
}

export const uiStore = new UIStore();

