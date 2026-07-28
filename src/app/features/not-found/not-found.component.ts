import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found" aria-labelledby="not-found-title">
      <p class="not-found__code" aria-hidden="true">۴۰۴</p>
      <h1 id="not-found-title">صفحه پیدا نشد</h1>
      <p>نشانی واردشده معتبر نیست یا این صفحه جابه‌جا شده است.</p>
      <a routerLink="/">بازگشت به صفحه اصلی</a>
    </section>
  `,
  styles: [`
    .not-found {
      inline-size: min(100% - 2rem, 44rem);
      margin-inline: auto;
      padding-block: clamp(4rem, 12vw, 8rem);
      text-align: center;
    }
    .not-found__code {
      color: var(--color-gold-primary);
      font-size: clamp(3rem, 14vw, 7rem);
      font-weight: 700;
    }
    .not-found h1 { margin-block: var(--space-sm); }
    .not-found a {
      display: inline-flex;
      min-block-size: 44px;
      margin-block-start: var(--space-md);
      padding-inline: var(--space-md);
      align-items: center;
      color: var(--color-white);
      background: var(--color-dark-charcoal);
      border-radius: var(--border-radius-sm);
      text-decoration: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundComponent {}
