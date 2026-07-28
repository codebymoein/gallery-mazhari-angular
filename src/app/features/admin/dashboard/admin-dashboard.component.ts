import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminAnalyticsService } from '@core/services/admin-analytics.service';
import { AdminOrdersService } from '@core/services/admin-orders.service';
import { AdminInventoryService } from '@core/services/admin-inventory.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import { AdminAuthService } from '@core/services/admin-auth.service';
import { AdmChartComponent } from '../shared/adm-chart.component';
import { formatCompact, formatFaDate } from '../shared/admin-format';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AdmChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly analytics = inject(AdminAnalyticsService);
  private readonly auth = inject(AdminAuthService);
  readonly orders = inject(AdminOrdersService);
  readonly inventory = inject(AdminInventoryService);
  readonly queue = inject(StagingQueueService);

  readonly user = this.auth.user;
  readonly isManager = this.auth.isManager;
  readonly snapshot = this.analytics.snapshot;
  readonly feed = this.analytics.liveFeed;

  readonly formatCompact = formatCompact;
  readonly formatFaDate = formatFaDate;

  ngOnInit(): void {
    this.analytics.startLiveSimulation();
  }

  ngOnDestroy(): void {
    this.analytics.stopLiveSimulation();
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر';
    if (hour < 18) return 'روز بخیر';
    return 'عصر بخیر';
  }

  feedDot(kind: string): string {
    if (kind === 'order' || kind === 'consultation') return 'adm-list__dot--success';
    if (kind === 'dream') return 'adm-list__dot--info';
    if (kind === 'staff') return 'adm-list__dot--warning';
    return '';
  }
}
