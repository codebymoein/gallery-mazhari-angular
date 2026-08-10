import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ResponsiveProductImageDirective } from '@shared/directives/responsive-product-image.directive';
import { LineIconComponent } from '../line-icon/line-icon.component';

@Component({
  selector: 'app-storefront-product-card',
  standalone: true,
  imports: [LineIconComponent, ResponsiveProductImageDirective, RouterLink],
  template: `
    <a
      class="product-card__link"
      [routerLink]="['/product', productId()]"
      [attr.aria-label]="name()"
    >
      <span class="product-card__media">
        <span class="product-card__gallery">
          @for (image of images(); track image; let first = $first) {
            <img
              class="product-card__image"
              [src]="image"
              [appResponsiveProductImage]="image"
              [alt]="first ? name() : ''"
              loading="lazy"
              decoding="async"
              width="480"
              height="640"
              (error)="hideBrokenImage($event)"
            />
          }
        </span>

        @if (tag()) {
          <span class="product-card__tag">{{ tag() }}</span>
        }
        @if (images().length > 1) {
          <span class="product-card__gallery-count" aria-hidden="true">
            {{ images().length }} تصویر
          </span>
        }
        <span class="product-card__view" aria-hidden="true">
          <app-line-icon name="arrow-left" />
        </span>
      </span>

      <span class="product-card__body">
        @if (kicker()) {
          <span class="product-card__kicker">{{ kicker() }}</span>
        }
        <strong class="product-card__name">{{ name() }}</strong>
        <span class="product-card__meta">
          @if (price()) {
            <small class="product-card__price">{{ price() }}</small>
          } @else {
            <small class="product-card__cta">مشاهده جزئیات</small>
          }
          <span class="product-card__rule" aria-hidden="true"></span>
        </span>
      </span>
    </a>
  `,
  styleUrl: './storefront-product-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontProductCardComponent {
  readonly productId = input.required<string>();
  readonly name = input.required<string>();
  readonly images = input.required<readonly string[]>();
  readonly tag = input('');
  readonly kicker = input('');
  readonly price = input('');

  hideBrokenImage(event: Event): void {
    (event.currentTarget as HTMLImageElement).hidden = true;
  }
}
