import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  inject,
  signal
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '@env/environment';

/**
 * Ethical recommendation widget.
 * Never shows fake scarcity/popularity. Hides when no credible recommendations.
 * Urgency copy only when server returns real low-stock inventory.
 */
@Component({
  selector: 'app-recommendation-widget',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (items().length) {
      <section class="reco" dir="rtl" [attr.data-widget]="widgetKey">
        <header>
          <h2>{{ displayLabel() }}</h2>
          <p>پیشنهاد بر اساس سازگاری سبک، تگ‌های پنهان و موجودی واقعی — بدون ادعای ساختگی.</p>
        </header>
        <div class="reco-grid">
          @for (item of items(); track item.code) {
            <a class="reco-card" [routerLink]="['/product', item.code]">
              <strong>{{ item.name || item.code }}</strong>
              <span>{{ item.category }}</span>
              @if (item.urgencyLabel) {
                <em class="urgency">{{ item.urgencyLabel }}</em>
              } @else if (item.stock !== null && item.stock !== undefined && item.stock > 0) {
                <em>موجود</em>
              }
            </a>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .reco {
        margin: 2rem 0;
        padding: 1.5rem 0;
        border-top: 1px solid rgba(28, 20, 16, 0.1);
      }
      .reco h2 {
        margin: 0 0 0.35rem;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 1.35rem;
      }
      .reco header p {
        margin: 0 0 1rem;
        color: #6b5a4e;
        font-size: 0.9rem;
      }
      .reco-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        gap: 0.75rem;
      }
      .reco-card {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.85rem;
        text-decoration: none;
        color: inherit;
        border: 1px solid rgba(28, 20, 16, 0.12);
        background: rgba(255, 255, 255, 0.65);
      }
      .reco-card em {
        font-style: normal;
        font-size: 0.8rem;
        color: #2f6b4f;
      }
      .reco-card em.urgency {
        color: #8a4b2e;
        font-weight: 600;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationWidgetComponent implements OnChanges {
  private readonly http = inject(HttpClient);

  @Input({ required: true }) productCode = '';
  @Input() widgetLabel = '';
  @Input() widgetKey = 'complete_your_bridal_look';

  readonly displayLabel = signal('تکمیل استایل عروس شما');
  readonly items = signal<
    Array<{
      code: string;
      name?: string;
      category?: string;
      stock?: number;
      urgencyLabel?: string | null;
    }>
  >([]);

  ngOnChanges(): void {
    if (!this.productCode) {
      this.items.set([]);
      return;
    }
    if (this.widgetLabel) this.displayLabel.set(this.widgetLabel);

    const url = `${environment.backendApiBaseUrl}/platform/public/recommendations/${encodeURIComponent(this.productCode)}?widget=${encodeURIComponent(this.widgetKey)}`;
    this.http
      .get<{
        widgetLabel?: string;
        recommendations?: Array<{
          product: Record<string, unknown>;
          urgencyLabel?: string | null;
        }>;
      }>(url)
      .subscribe({
        next: (res) => {
          if (res.widgetLabel && !this.widgetLabel) {
            this.displayLabel.set(res.widgetLabel);
          }
          const list = (res.recommendations || [])
            .map((r) => ({
              product: r.product,
              urgencyLabel: r.urgencyLabel ?? null
            }))
            .filter(
              (r) =>
                r.product &&
                Number(r.product['stock'] ?? 0) > 0 &&
                (r.product['status'] === 'published' ||
                  r.product['status'] === 'approved')
            )
            .map((r) => ({
              code: String(r.product['code']),
              name: String(r.product['code']),
              category: String(r.product['category'] ?? ''),
              stock: Number(r.product['stock'] ?? 0),
              urgencyLabel: r.urgencyLabel
            }));
          this.items.set(list);
        },
        error: () => this.items.set([])
      });
  }
}
