import { Injectable, signal, computed, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'gm-theme';

  readonly theme  = signal<Theme>(this.getInitial());
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const dark = this.theme() === 'dark';
      const html  = document.documentElement;
      const body  = document.body;

      // Set on both html AND body so all CSS selectors work
      html.setAttribute('data-theme', this.theme());
      body.setAttribute('data-theme', this.theme());

      // Toggle class (easier for CSS overrides)
      html.classList.toggle('dark-mode', dark);
      body.classList.toggle('dark-mode', dark);

      html.style.colorScheme = this.theme();
      localStorage.setItem(this.KEY, this.theme());
    }, { allowSignalWrites: false });
  }

  toggle(): void {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  private getInitial(): Theme {
    const stored = localStorage.getItem(this.KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
