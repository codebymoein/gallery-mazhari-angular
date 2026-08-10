import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LineIconName =
  | 'account'
  | 'arrow-left'
  | 'bag'
  | 'chevron-down'
  | 'close'
  | 'menu'
  | 'search';

@Component({
  selector: 'app-line-icon',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('account') {
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.25 20c.65-4 3.1-6 6.75-6s6.1 2 6.75 6" />
        }
        @case ('arrow-left') {
          <path d="M19 12H5m6-6-6 6 6 6" />
        }
        @case ('bag') {
          <path d="M5 8.25h14l-1 12H6l-1-12Z" />
          <path d="M9 9V6.75a3 3 0 0 1 6 0V9" />
        }
        @case ('chevron-down') {
          <path d="m6.5 9.5 5.5 5 5.5-5" />
        }
        @case ('close') {
          <path d="m5 5 14 14M19 5 5 19" />
        }
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('search') {
          <circle cx="10.75" cy="10.75" r="6.25" />
          <path d="m15.5 15.5 4.25 4.25" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      width: var(--icon-size, 1.25rem);
      height: var(--icon-size, 1.25rem);
      display: inline-grid;
      flex: 0 0 auto;
      place-items: center;
      pointer-events: none;
    }

    svg {
      width: 100%;
      height: 100%;
      display: block;
      overflow: visible;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineIconComponent {
  readonly name = input.required<LineIconName>();
}
