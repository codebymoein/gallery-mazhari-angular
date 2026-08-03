import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { InventoryExcelService } from '@core/services/inventory-excel.service';
import { StagingQueueService } from '@core/services/staging-queue.service';
import { PublishedCatalogSyncService } from '@core/services/published-catalog-sync.service';
import { ExcelImportResult } from '@shared/models/staging-product.model';

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './excel-import.component.html',
  styleUrls: ['./excel-import.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExcelImportComponent implements OnDestroy {
  private readonly excel = inject(InventoryExcelService);
  private readonly queue = inject(StagingQueueService);
  private readonly publishedCatalog = inject(PublishedCatalogSyncService);
  private readonly cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  dragOver = false;
  parsing = false;
  error = '';
  result: ExcelImportResult | null = null;
  addedCount = 0;
  removedCount = 0;

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  downloadTemplate(): void {
    this.excel.downloadTemplate();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onFilePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
    input.value = '';
  }

  private handleFile(file: File): void {
    this.error = '';
    this.result = null;
    this.addedCount = 0;
    this.removedCount = 0;

    if (!this.excel.isAcceptedFile(file)) {
      this.error = 'فقط فایل‌های اکسل/CSV (.xls / .xlsx / .csv) پذیرفته می‌شوند.';
      this.cdr.markForCheck();
      return;
    }

    this.parsing = true;
    this.cdr.markForCheck();

    this.sub?.unsubscribe();
    this.sub = this.excel
      .parseInventoryFile(file, [
        ...this.queue.items().map(item => item.code),
        ...this.publishedCatalog.getCachedProductCodes()
      ])
      .subscribe({
      next: (result) => {
        void this.queue
          .applyExcelImport(result.accepted, result.removedOutOfStock, {
            fileName: result.fileName
          })
          .then((applied) => {
            this.addedCount = applied.added;
            this.removedCount = applied.removed;
            this.result = result;
            this.parsing = false;
            this.cdr.markForCheck();
          })
          .catch((err: unknown) => {
            this.error = err instanceof Error ? err.message : 'ثبت فایل موجودی روی سرور انجام نشد.';
            this.result = null;
            this.parsing = false;
            this.cdr.markForCheck();
          });
      },
      error: (err: Error) => {
        this.error = err?.message || 'خطا در پردازش فایل.';
        this.parsing = false;
        this.cdr.markForCheck();
      }
    });
  }
}
