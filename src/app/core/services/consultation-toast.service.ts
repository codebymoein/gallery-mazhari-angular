import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConsultationToastService {
  readonly visible = signal(false);
  readonly message = signal('به زودی باهاتون تماس می‌گیریم');

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  show(message = 'به زودی باهاتون تماس می‌گیریم'): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.message.set(message);
    this.visible.set(true);
    this.hideTimer = setTimeout(() => this.hide(), 5000);
  }

  hide(): void {
    this.visible.set(false);
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
