import { makeAutoObservable, runInAction } from 'mobx';

import type { PepsometerLocation } from '@/lib/api/pepsometer-api';
import { listLocations } from '@/lib/api/pepsometer-api';

type PersistedLocation = PepsometerLocation;

const STORAGE_KEY = 'pepsodent_location';

class LocationStore {
  selected: PersistedLocation | null = null;
  locations: PepsometerLocation[] = [];
  isLoading = false;
  error: string | null = null;
  lastLoadedAt: number | null = null;
  hasHydrated = false;

  constructor() {
    makeAutoObservable(this);
  }

  hydrate() {
    if (this.hasHydrated) return;
    this.hasHydrated = true;
    this.loadFromStorage();
  }

  selectLocation(location: PepsometerLocation) {
    this.selected = location;
    this.saveToStorage();
  }

  clearSelected() {
    this.selected = null;
    this.saveToStorage();
  }

  async fetchLocations(force: boolean = false) {
    if (this.isLoading) return;
    if (!force && this.locations.length > 0) return;

    this.isLoading = true;
    this.error = null;

    try {
      const locations = await listLocations({ per_page: 200 });
      runInAction(() => {
        this.locations = locations;
        this.lastLoadedAt = Date.now();
        this.isLoading = false;
      });
    } catch (e) {
      runInAction(() => {
        this.error = e instanceof Error ? e.message : 'Failed to load locations';
        this.isLoading = false;
      });
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    if (this.selected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selected));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as PersistedLocation;
      runInAction(() => {
        this.selected = parsed;
      });
    } catch (e) {
      console.error('Failed to load location from storage:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const locationStore = new LocationStore();



