import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
  TooltipItem
} from 'chart.js';
import { AnalyticsPoint } from '@shared/models/admin-enterprise.model';

Chart.register(...registerables);

@Component({
  selector: 'app-adm-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">
      <canvas #canvas role="img" [attr.aria-label]="title || 'نمودار تحلیلی'"></canvas>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .chart-wrap {
        position: relative;
        width: 100%;
        height: 230px;
      }
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdmChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'line';
  @Input() title = '';
  @Input() points: AnalyticsPoint[] = [];
  @Input() color = '#b8973e';
  @Input() fill = true;
  /** واحد نمایش در tooltip مثلاً «میلیون تومان» یا «٪» */
  @Input() unit = '';

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['points'] ||
        changes['type'] ||
        changes['color'] ||
        changes['unit']) &&
      this.canvasRef
    ) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.canvasRef?.nativeElement) return;
    this.chart?.destroy();

    const labels = this.points.map((p) => p.label);
    const data = this.points.map((p) => p.value);
    const isDoughnut = this.type === 'doughnut' || this.type === 'pie';
    const unit = this.unit;

    const palette = ['#b8973e', '#1c1917', '#78716c', '#d4af37', '#57534e', '#a8a29e'];

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels,
        datasets: [
          {
            label: this.title || 'مقدار',
            data,
            borderColor: this.color,
            backgroundColor: isDoughnut
              ? palette
              : this.fill
                ? this.hexToRgba(this.color, 0.16)
                : this.color,
            borderWidth: isDoughnut ? 0 : 2.25,
            tension: 0.35,
            fill: this.fill && !isDoughnut,
            pointRadius: isDoughnut ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: this.color,
            borderRadius: this.type === 'bar' ? 4 : undefined
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: isDoughnut,
            position: 'bottom',
            rtl: true,
            labels: {
              boxWidth: 10,
              padding: 12,
              font: { family: 'Tahoma', size: 11 },
              color: '#57534e'
            }
          },
          tooltip: {
            rtl: true,
            backgroundColor: '#1c1917',
            titleFont: { family: 'Tahoma', size: 12 },
            bodyFont: { family: 'Tahoma', size: 12 },
            padding: 10,
            callbacks: {
              label: (ctx: TooltipItem<ChartType>) => {
                const raw = ctx.parsed;
                const val =
                  typeof raw === 'number'
                    ? raw
                    : ((raw as { y?: number })?.y ?? ctx.raw);
                const num = new Intl.NumberFormat('fa-IR', {
                  maximumFractionDigits: 1
                }).format(Number(val));
                const suffix = unit ? ` ${unit}` : '';
                if (isDoughnut) {
                  return ` ${ctx.label}: ${num}${suffix || '٪'}`;
                }
                return ` ${ctx.dataset.label}: ${num}${suffix}`;
              }
            }
          }
        },
        scales: isDoughnut
          ? undefined
          : {
              x: {
                grid: { display: false },
                ticks: {
                  color: '#78716c',
                  font: { family: 'Tahoma', size: 10 },
                  maxRotation: 0
                },
                border: { display: false }
              },
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(28,25,23,0.06)' },
                ticks: {
                  color: '#78716c',
                  font: { family: 'Tahoma', size: 10 },
                  callback: (value) =>
                    new Intl.NumberFormat('fa-IR', {
                      maximumFractionDigits: 1
                    }).format(Number(value))
                },
                border: { display: false }
              }
            }
      }
    };

    this.chart = new Chart(this.canvasRef.nativeElement, config);
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
