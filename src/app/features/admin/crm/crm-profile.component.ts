import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AdminCrmService } from '@core/services/admin-crm.service';
import { formatFaDate, formatToman } from '../shared/admin-format';

@Component({
  selector: 'app-crm-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './crm-profile.component.html',
  styleUrls: ['./crm-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrmProfileComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly crm = inject(AdminCrmService);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id') || '')),
    { initialValue: '' }
  );

  readonly client = computed(() => this.crm.getById(this.id() || ''));

  readonly formatToman = formatToman;
  readonly formatFaDate = formatFaDate;

  appointmentStatus(status: string): string {
    const map: Record<string, string> = {
      confirmed: 'تاییدشده',
      pending: 'در انتظار',
      done: 'انجام‌شده'
    };
    return map[status] || status;
  }
}
