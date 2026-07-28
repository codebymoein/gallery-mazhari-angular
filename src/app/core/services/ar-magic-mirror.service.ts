import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Controls the full-screen AR Magic Mirror overlay. */
@Injectable({ providedIn: 'root' })
export class ArMagicMirrorService {
  private readonly openSubject = new BehaviorSubject<boolean>(false);

  readonly isOpen$: Observable<boolean> = this.openSubject.asObservable();

  isOpen(): boolean {
    return this.openSubject.value;
  }

  open(): void {
    this.openSubject.next(true);
  }

  close(): void {
    this.openSubject.next(false);
  }

  toggle(): void {
    this.openSubject.next(!this.openSubject.value);
  }
}
