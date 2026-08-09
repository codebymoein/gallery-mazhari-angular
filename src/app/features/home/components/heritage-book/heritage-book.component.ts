import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  HostListener,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { assetUrl } from '@shared/utils/asset-url';

const HERITAGE_INTRO_PREFERENCE_KEY = 'gallerymazhari:heritage-intro:v1';
const LAST_PAGE_INDEX = 3;
const SWIPE_THRESHOLD_PX = 48;

@Component({
  selector: 'app-heritage-book',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './heritage-book.component.html',
  styleUrl: './heritage-book.component.css',
})
export class HeritageBookComponent {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private touchStartX: number | null = null;

  readonly isOpen = signal(false);
  readonly preferenceResolved = signal(false);
  readonly pageIndex = signal(0);
  readonly turnDirection = signal<'forward' | 'backward'>('forward');
  readonly archiveImage = assetUrl('assets/images/home-hero-bride.webp');

  constructor() {
    afterNextRender(() => {
      if (!this.isBrowser) {
        return;
      }

      const hasSeenIntro = this.readSeenPreference();
      this.preferenceResolved.set(true);

      if (!hasSeenIntro) {
        this.openBook();
      }
    });
  }

  openBook(): void {
    this.turnDirection.set('forward');
    this.pageIndex.set(0);
    this.isOpen.set(true);
  }

  skip(): void {
    this.rememberSeenPreference();
    this.isOpen.set(false);
  }

  nextPage(): void {
    if (this.pageIndex() >= LAST_PAGE_INDEX) {
      this.skip();
      return;
    }

    this.turnDirection.set('forward');
    this.pageIndex.update(index => index + 1);
  }

  previousPage(): void {
    if (this.pageIndex() === 0) {
      return;
    }

    this.turnDirection.set('backward');
    this.pageIndex.update(index => index - 1);
  }

  enterSite(): void {
    this.skip();
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0]?.clientX ?? null;
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.touchStartX === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX === undefined) {
      this.touchStartX = null;
      return;
    }

    const deltaX = touchEndX - this.touchStartX;
    this.touchStartX = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) {
      return;
    }

    if (deltaX < 0) {
      this.nextPage();
    } else {
      this.previousPage();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.skip();
    }
  }

  private readSeenPreference(): boolean {
    try {
      return localStorage.getItem(HERITAGE_INTRO_PREFERENCE_KEY) === 'seen';
    } catch {
      return false;
    }
  }

  private rememberSeenPreference(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(HERITAGE_INTRO_PREFERENCE_KEY, 'seen');
    } catch {
      // Storage is optional presentation state. Failure must never block storefront use.
    }
  }
}
