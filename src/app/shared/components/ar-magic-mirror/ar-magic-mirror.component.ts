import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  inject
} from '@angular/core';

import { Subscription } from 'rxjs';
import { ArMagicMirrorService } from '@core/services/ar-magic-mirror.service';

export interface ArAccessory {
  id: string;
  label: string;
  kind: 'crown' | 'veil' | 'earrings' | 'necklace';
  /** Optional thumbnail path; falls back to CSS placeholder. */
  thumb?: string;
}

@Component({
  selector: 'app-ar-magic-mirror',
  standalone: true,
  imports: [],
  templateUrl: './ar-magic-mirror.component.html',
  styleUrls: ['./ar-magic-mirror.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArMagicMirrorComponent implements OnDestroy {
  private readonly mirror = inject(ArMagicMirrorService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl?: ElementRef<HTMLCanvasElement>;

  readonly accessories: ArAccessory[] = [
    { id: 'crown-crystal', label: 'تاج کریستال', kind: 'crown' },
    { id: 'crown-pearl', label: 'تاج مروارید', kind: 'crown' },
    { id: 'veil-cathedral', label: 'تور کلیسایی', kind: 'veil' },
    { id: 'veil-short', label: 'تور کوتاه', kind: 'veil' },
    { id: 'earrings-drop', label: 'گوشواره آویز', kind: 'earrings' },
    { id: 'necklace-choker', label: 'گردنبند', kind: 'necklace' }
  ];

  isOpen = false;
  isEntering = false;
  isLeaving = false;
  cameraReady = false;
  cameraError = '';
  selectedId = this.accessories[0].id;
  capturing = false;
  captureFlash = false;
  statusMessage = '';

  private stream: MediaStream | null = null;
  private openSub?: Subscription;
  private leaveTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.openSub = this.mirror.isOpen$.subscribe(open => {
      if (open && !this.isOpen) {
        void this.openMirror();
      } else if (!open && this.isOpen) {
        this.beginClose();
      }
    });
  }

  get selected(): ArAccessory {
    return (
      this.accessories.find(a => a.id === this.selectedId) ?? this.accessories[0]
    );
  }

  selectAccessory(id: string): void {
    this.selectedId = id;
    this.cdr.markForCheck();
  }

  async capture(): Promise<void> {
    if (this.capturing || !this.cameraReady) {
      return;
    }

    this.capturing = true;
    this.captureFlash = true;
    this.statusMessage = 'در حال ثبت شات…';
    this.cdr.markForCheck();

    const video = this.videoEl?.nativeElement;
    const canvas = this.canvasEl?.nativeElement;

    if (video && canvas && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      console.log('[Gallery Mazhari · AR Capture]', {
        accessory: this.selected.label,
        size: `${canvas.width}×${canvas.height}`
      });
    }

    window.setTimeout(() => {
      this.captureFlash = false;
      this.capturing = false;
      this.statusMessage = 'شات ذخیره شد';
      this.cdr.markForCheck();
      window.setTimeout(() => {
        this.statusMessage = '';
        this.cdr.markForCheck();
      }, 1600);
    }, 420);
  }

  requestClose(): void {
    this.mirror.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.requestClose();
    }
  }

  ngOnDestroy(): void {
    this.openSub?.unsubscribe();
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
    }
    this.stopCamera();
  }

  private async openMirror(): Promise<void> {
    this.isOpen = true;
    this.isEntering = true;
    this.isLeaving = false;
    this.cameraError = '';
    this.cameraReady = false;
    this.statusMessage = '';
    this.cdr.markForCheck();

    // Allow enter transition paint before starting camera.
    requestAnimationFrame(() => {
      this.isEntering = false;
      this.cdr.markForCheck();
    });

    try {
      await this.startCamera();
    } catch (err) {
      this.cameraError =
        'دسترسی به دوربین ممکن نشد. لطفاً مجوز دوربین را در مرورگر فعال کنید.';
      console.warn('[AR Magic Mirror]', err);
      this.cdr.markForCheck();
    }
  }

  private beginClose(): void {
    if (this.isLeaving) {
      return;
    }
    this.isLeaving = true;
    this.cdr.markForCheck();
    this.stopCamera();

    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
    }
    this.leaveTimer = setTimeout(() => {
      this.isOpen = false;
      this.isLeaving = false;
      this.cameraReady = false;
      this.cdr.markForCheck();
    }, 320);
  }

  private async startCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia is not supported');
    }

    this.stopCamera();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    const video = this.videoEl?.nativeElement;
    if (!video) {
      return;
    }

    video.srcObject = this.stream;
    await video.play();
    this.cameraReady = true;
    this.cdr.markForCheck();
  }

  private stopCamera(): void {
    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    const video = this.videoEl?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }
}
