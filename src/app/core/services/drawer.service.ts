import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly document = inject(DOCUMENT);
  private previousBodyStyles: Pick<CSSStyleDeclaration, 'overflow' | 'position' | 'top' | 'width'> | null = null;
  private lockedScrollY = 0;
  readonly isOpen = signal(false);

  open(): void {
    if (this.isOpen()) return;
    const body = this.document.body;
    this.lockedScrollY = this.document.defaultView?.scrollY ?? 0;
    this.previousBodyStyles = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width
    };
    this.isOpen.set(true);
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${this.lockedScrollY}px`;
    body.style.width = '100%';
  }

  close(): void {
    if (!this.isOpen()) return;
    const body = this.document.body;
    this.isOpen.set(false);
    if (this.previousBodyStyles) {
      body.style.overflow = this.previousBodyStyles.overflow;
      body.style.position = this.previousBodyStyles.position;
      body.style.top = this.previousBodyStyles.top;
      body.style.width = this.previousBodyStyles.width;
    }
    this.previousBodyStyles = null;
    this.document.defaultView?.scrollTo({ top: this.lockedScrollY, behavior: 'auto' });
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
}
