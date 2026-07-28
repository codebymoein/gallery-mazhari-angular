import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CONSULTATION_FOLLOW_UP_LABELS,
  ConsultationFollowUpTag,
  ConsultationService,
  StoredConsultationRequest
} from '@core/services/consultation.service';
import { DreamCanvasService, DreamCanvasItem } from '@core/services/dream-canvas.service';
import { CONSULTATION_CONTACT_TIMES } from '@shared/data/consultation-options';
import { onImgErrorUseFallback } from '@shared/utils/asset-url';

const FOLLOW_UP_OPTIONS = Object.entries(CONSULTATION_FOLLOW_UP_LABELS).map(
  ([value, label]) => ({ value: value as ConsultationFollowUpTag, label })
);

@Component({
  selector: 'app-client-insights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-insights.component.html',
  styleUrls: ['./client-insights.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientInsightsComponent implements OnInit {
  private readonly consultation = inject(ConsultationService);
  private readonly dreamCanvas = inject(DreamCanvasService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly followUpOptions = FOLLOW_UP_OPTIONS;
  readonly onImgError = onImgErrorUseFallback;

  requests: StoredConsultationRequest[] = [];
  dreamItems: DreamCanvasItem[] = [];
  toast = '';

  ngOnInit(): void {
    this.loadData();
  }

  setTag(req: StoredConsultationRequest, tag: ConsultationFollowUpTag): void {
    this.consultation.setFollowUpTag(req.id, tag);
    this.loadData();
    this.toast = `برچسب «${CONSULTATION_FOLLOW_UP_LABELS[tag]}» برای ${req.last_name} ثبت شد.`;
    window.setTimeout(() => {
      this.toast = '';
      this.cdr.markForCheck();
    }, 2800);
  }

  tagLabel(tag?: ConsultationFollowUpTag): string {
    return tag ? CONSULTATION_FOLLOW_UP_LABELS[tag] : 'بدون برچسب';
  }

  contactTimeLabel(key: string): string {
    return CONSULTATION_CONTACT_TIMES[key] ?? key;
  }

  formatDate(iso: string): string {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  formatCeremonyDate(date: string): string {
    try {
      const [y, m, d] = date.split('-').map(Number);
      if (!y || !m || !d) return date;
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(y, m - 1, d));
    } catch {
      return date;
    }
  }

  dreamPreview(): DreamCanvasItem[] {
    return this.dreamItems.slice(0, 6);
  }

  private loadData(): void {
    this.requests = this.consultation.getRequests();
    this.dreamItems = this.dreamCanvas.items;
    this.cdr.markForCheck();
  }
}
