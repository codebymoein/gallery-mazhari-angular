import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminActivityService } from '@core/services/admin-activity.service';
import {
  ADMIN_ACTIVITY_LABELS,
  AdminActivityAction
} from '@shared/models/admin-activity.model';

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-activity.component.html',
  styleUrls: ['./admin-activity.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminActivityComponent {
  private readonly activity = inject(AdminActivityService);

  readonly labels = ADMIN_ACTIVITY_LABELS;
  readonly filter = signal<'all' | AdminActivityAction>('all');
  readonly query = signal('');

  readonly rows = computed(() => {
    const f = this.filter();
    const q = this.query().trim().toLowerCase();
    return this.activity.entries().filter((e) => {
      if (f !== 'all' && e.action !== f) return false;
      if (!q) return true;
      return (
        e.summary.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.entityCode || '').toLowerCase().includes(q)
      );
    });
  });

  setFilter(value: 'all' | AdminActivityAction): void {
    this.filter.set(value);
  }

  onSearch(value: string): void {
    this.query.set(value);
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

  roleLabel(role: string): string {
    return role === 'manager' ? 'مدیر' : 'کارشناس';
  }
}
