import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

type WebVitalName = 'CLS' | 'INP' | 'LCP' | 'TTFB';
type NavigationType = 'navigate' | 'reload' | 'back_forward' | 'prerender' | 'unknown';

interface EventTimingEntry extends PerformanceEntry {
  duration: number;
  interactionId?: number;
}

@Injectable({ providedIn: 'root' })
export class WebVitalsRumService {
  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;
  private clsValue = 0;
  private inpByInteraction = new Map<number, number>();

  init(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) return;
    this.initialized = true;

    this.reportTtfb();
    this.observeLcp();
    this.observeCls();
    this.observeInp();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.report('CLS', this.clsValue);
        const inp = this.currentInp();
        if (inp !== null) this.report('INP', inp);
      }
    });
  }

  private reportTtfb(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!navigation) return;
    this.report('TTFB', Math.max(0, navigation.responseStart));
  }

  private observeLcp(): void {
    this.observe('largest-contentful-paint', entries => {
      const last = entries.at(-1);
      if (last) this.report('LCP', last.startTime);
    });
  }

  private observeCls(): void {
    this.observe('layout-shift', entries => {
      for (const entry of entries) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!shift.hadRecentInput && typeof shift.value === 'number') {
          this.clsValue += shift.value;
        }
      }
    });
  }

  private observeInp(): void {
    this.observe(
      'event',
      entries => {
        for (const entry of entries as EventTimingEntry[]) {
          if (!entry.interactionId || entry.duration <= 0) continue;
          const previous = this.inpByInteraction.get(entry.interactionId) ?? 0;
          this.inpByInteraction.set(entry.interactionId, Math.max(previous, entry.duration));
        }
      },
      { durationThreshold: 40 },
    );
  }

  private currentInp(): number | null {
    const durations = [...this.inpByInteraction.values()].sort((a, b) => a - b);
    if (!durations.length) return null;
    const index = Math.max(0, Math.ceil(durations.length * 0.98) - 1);
    return durations[index] ?? null;
  }

  private observe(
    type: string,
    onEntries: (entries: PerformanceEntry[]) => void,
    options: Record<string, unknown> = {},
  ): void {
    try {
      const observer = new PerformanceObserver(list => onEntries(list.getEntries()));
      observer.observe({ type, buffered: true, ...options } as PerformanceObserverInit);
    } catch {
      // Unsupported metric APIs must not break Safari/Firefox or the storefront.
    }
  }

  private report(name: WebVitalName, value: number): void {
    if (!Number.isFinite(value) || value < 0) return;

    const body = JSON.stringify({
      name,
      value,
      route: location.pathname.slice(0, 160) || '/',
      navigationType: this.navigationType(),
    });

    void fetch(`${environment.backendApiBaseUrl}/ops/web-vitals`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined);
  }

  private navigationType(): NavigationType {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const type = navigation?.type;
    return type === 'navigate' || type === 'reload' || type === 'back_forward' || type === 'prerender'
      ? type
      : 'unknown';
  }
}
