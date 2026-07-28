import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  LookbookCategory,
  LookbookItem,
  LookbookService
} from '@core/services/lookbook.service';
import { ArMagicMirrorService } from '@core/services/ar-magic-mirror.service';

interface CatalogSlot {
  category: LookbookCategory;
  label: string;
  emptyHint: string;
}

@Component({
  selector: 'app-catalog-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog-builder.component.html',
  styleUrls: ['./catalog-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogBuilderComponent implements OnInit, OnDestroy {
  private readonly lookbook = inject(LookbookService);
  private readonly arMirror = inject(ArMagicMirrorService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly slots: CatalogSlot[] = [
    {
      category: 'dress',
      label: 'لباس عروس',
      emptyHint: 'لباس رویایی خود را انتخاب کنید'
    },
    {
      category: 'crown',
      label: 'تاج',
      emptyHint: 'تاج یا اکسسوری سر'
    },
    {
      category: 'shoes',
      label: 'کفش',
      emptyHint: 'کفش هماهنگ با استایل'
    }
  ];

  brideName = '';
  items: LookbookItem[] = [];
  shareFeedback = '';

  private itemsSub?: Subscription;
  private nameSub?: Subscription;

  ngOnInit(): void {
    this.brideName = this.lookbook.brideName;
    this.items = this.lookbook.items;

    this.itemsSub = this.lookbook.items$.subscribe(items => {
      this.items = items;
      this.cdr.markForCheck();
    });

    this.nameSub = this.lookbook.brideName$.subscribe(name => {
      this.brideName = name;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.itemsSub?.unsubscribe();
    this.nameSub?.unsubscribe();
  }

  get catalogTitle(): string {
    const name = this.brideName.trim();
    return name ? `کاتالوگ اختصاصی ${name}` : 'کاتالوگ اختصاصی عروس';
  }

  itemFor(category: LookbookCategory): LookbookItem | undefined {
    return this.items.find(item => item.category === category);
  }

  onNameChange(value: string): void {
    this.lookbook.setBrideName(value);
  }

  generatePdf(): void {
    this.lookbook.generatePdfAndShare();
    this.shareFeedback = 'کاتالوگ آماده اشتراک‌گذاری است';
    this.cdr.markForCheck();
    window.setTimeout(() => {
      this.shareFeedback = '';
      this.cdr.markForCheck();
    }, 2200);
  }

  addAnotherItem(): void {
    const extras: LookbookItem[] = [
      {
        id: `extra-${Date.now()}`,
        name: 'تور ابریشمی بلند',
        category: 'veil',
        subtitle: 'افزوده از کاتالوگ‌ساز'
      },
      {
        id: `extra-${Date.now() + 1}`,
        name: 'گوشواره مروارید',
        category: 'other',
        subtitle: 'افزوده از کاتالوگ‌ساز'
      }
    ];

    const next = extras.find(e => !this.items.some(i => i.category === e.category)) ?? extras[0];
    this.lookbook.addItem({ ...next, id: `extra-${Date.now()}` });
  }

  removeSlot(category: LookbookCategory): void {
    const item = this.itemFor(category);
    if (item) {
      this.lookbook.removeItem(item.id);
    }
  }

  removeItem(id: string): void {
    this.lookbook.removeItem(id);
  }

  openMagicMirror(): void {
    this.arMirror.open();
  }

  extraItems(): LookbookItem[] {
    return this.items.filter(
      item => item.category !== 'dress' && item.category !== 'crown' && item.category !== 'shoes'
    );
  }
}
