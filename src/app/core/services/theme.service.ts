import { Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'auth-portal-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal(false);

  initializeTheme(): void {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const darkMode = storedTheme ? storedTheme === 'dark' : prefersDark;
    this.setTheme(darkMode, false);
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode(), true);
  }

  private setTheme(darkMode: boolean, persist: boolean): void {
    this.isDarkMode.set(darkMode);
    document.documentElement.classList.toggle('dark-theme', darkMode);

    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    }
  }
}
