import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  inject
} from '@angular/core';

/**
 * Emits when a click occurs outside the host element.
 * Use on dropdowns, drawers, and overlays that should close on outside click.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Output() appClickOutside = new EventEmitter<MouseEvent>();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (!this.host.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
