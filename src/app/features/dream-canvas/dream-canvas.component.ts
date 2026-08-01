import { Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { DreamCanvasService } from '@core/services/dream-canvas.service';

@Component({
  selector: 'app-dream-canvas',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="dream-page" dir="rtl">
      <div class="dream-page__inner">
        <p class="dream-page__eyebrow" lang="en" dir="ltr">MY DREAM CANVAS</p>
        <h1>بوم رویایی من</h1>
        <p>
          انتخاب‌های شما در دکمه شناور پایین صفحه نگه داشته می‌شوند.
          از آنجا می‌توانید آن‌ها را ببینید، حذف کنید یا به کاتالوگ برگردید.
        </p>
        <div class="dream-page__actions">
          <button type="button" (click)="openCanvas()">باز کردن بوم رویایی</button>
          <a routerLink="/catalog">رفتن به کاتالوگ</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .dream-page {
      min-height: 50vh;
      display: grid;
      place-items: center;
      padding: var(--space-lg) var(--space-sm);
      background: var(--color-bg-cream);
      font-family: var(--font-persian);
    }
    .dream-page__inner {
      max-width: 36rem;
      text-align: center;
    }
    .dream-page__eyebrow {
      margin: 0 0 .5rem;
      color: var(--color-gold-primary);
      font-family: var(--font-english);
      font-size: .72rem;
      letter-spacing: .16em;
      font-weight: 600;
    }
    h1 {
      margin: 0 0 .75rem;
      color: var(--color-dark-charcoal);
      font-size: clamp(1.4rem, 4vw, 2rem);
    }
    p {
      margin: 0;
      color: var(--color-text-muted);
      line-height: 1.8;
    }
    .dream-page__actions {
      margin-top: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: .75rem;
      justify-content: center;
    }
    button, a {
      min-height: 44px;
      padding: 0 1.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--border-radius-sm);
      font-family: var(--font-persian);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
    button {
      color: #fff;
      background: var(--color-gold-primary);
      border: 1px solid var(--color-gold-primary);
    }
    a {
      color: var(--color-dark-charcoal);
      background: transparent;
      border: 1px solid var(--color-border-light);
    }
  `]
})
export class DreamCanvasComponent implements OnInit {
  private readonly canvas = inject(DreamCanvasService);

  ngOnInit(): void {
    this.canvas.open();
  }

  openCanvas(): void {
    this.canvas.open();
  }
}
