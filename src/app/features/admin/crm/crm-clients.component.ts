import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminCrmService } from '@core/services/admin-crm.service';
import { formatCompact, formatFaDate, formatToman } from '../shared/admin-format';

@Component({
  selector: 'app-crm-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './crm-clients.component.html',
  styleUrls: ['./crm-clients.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CrmClientsComponent {
  private readonly crm = inject(AdminCrmService);

  readonly query = signal('');
  readonly clients = computed(() => this.crm.search(this.query()));
  readonly totalLtv = this.crm.totalLtv;

  readonly formatToman = formatToman;
  readonly formatFaDate = formatFaDate;
  readonly formatCompact = formatCompact;

  onSearch(value: string): void {
    this.query.set(value);
  }
}
