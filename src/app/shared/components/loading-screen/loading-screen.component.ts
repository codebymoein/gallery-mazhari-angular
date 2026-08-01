import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';


@Component({
  selector: 'app-loading-screen',
  standalone: true,
  imports: [],
  templateUrl: './loading-screen.component.html',
  styleUrls: ['./loading-screen.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingScreenComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  visible   = true;   // overlay shown
  exiting   = false;  // exit animation running
  progress  = 0;      // gold progress bar 0→100

  ngOnInit(): void {
    this.runProgress();
  }

  private runProgress(): void {
    const totalMs  = 2200;   // fast petal shower + brief pause
    const steps    = 60;
    const interval = totalMs / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;

      // Ease-out progress curve
      this.progress = Math.round(
        100 * (1 - Math.pow(1 - step / steps, 2))
      );
      this.cdr.markForCheck();

      if (step >= steps) {
        clearInterval(timer);
        this.startExit();
      }
    }, interval);
  }

  private startExit(): void {
    this.exiting = true;
    this.cdr.markForCheck();

    // Remove from DOM after exit animation finishes
    setTimeout(() => {
      this.visible = false;
      this.cdr.markForCheck();
    }, 700);
  }
}
