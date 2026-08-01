import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ConsultationToastService } from '@core/services/consultation-toast.service';

@Component({
  selector: 'app-consultation-toast',
  standalone: true,
  imports: [],
  template: `
    @if (toast.visible()) {
      <div
        class="consult-toast"
        role="status"
        aria-live="polite"
        dir="rtl"
        >
        <span class="consult-toast__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="m8.5 12.5 2.4 2.4 4.6-5"/>
          </svg>
        </span>
        <p class="consult-toast__text">{{ toast.message() }}</p>
        <button class="consult-toast__close" type="button" aria-label="بستن پیام" (click)="toast.hide()">×</button>
      </div>
    }
    `,
  styles: [`
    .consult-toast {
      position: fixed;
      inset-block-start: max(1rem, env(safe-area-inset-top, 0px));
      inset-inline: 0;
      z-index: 10050;
      width: min(19rem, calc(100% - 2rem));
      margin-inline: auto;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid color-mix(in srgb, #2e7d32 28%, transparent);
      border-radius: 0.65rem;
      background: #edf7ee;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      animation: consult-toast-in 0.35s ease;
      font-family: var(--font-persian);
    }

    .consult-toast__icon {
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      inline-size: 1.25rem;
      block-size: 1.25rem;
      color: #2e7d32;
    }

    .consult-toast__icon svg {
      inline-size: 1.1rem;
      block-size: 1.1rem;
    }

    .consult-toast__text {
      flex: 1 1 auto;
      margin: 0;
      color: #1b5e20;
      font-size: 0.74rem;
      font-weight: 500;
      line-height: 1.4;
    }

    .consult-toast__close {
      flex: 0 0 auto;
      inline-size: 1.35rem;
      block-size: 1.35rem;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: #2e7d32;
      font-size: 0.95rem;
      line-height: 1;
      cursor: pointer;
    }

    .consult-toast__close:hover {
      background: color-mix(in srgb, #2e7d32 10%, transparent);
    }

    @keyframes consult-toast-in {
      from {
        opacity: 0;
        transform: translateY(-0.75rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsultationToastComponent {
  readonly toast = inject(ConsultationToastService);
}
