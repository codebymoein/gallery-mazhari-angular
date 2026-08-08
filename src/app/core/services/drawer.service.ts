import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly document = inject(DOCUMENT);
  readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
    this.document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen.set(false);
    this.document.body.style.overflow = '';
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
}
