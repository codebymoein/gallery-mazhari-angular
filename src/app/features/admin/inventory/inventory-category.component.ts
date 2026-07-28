import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AdminInventoryService } from '@core/services/admin-inventory.service';
import { getCatalogCategoryBySlug } from '@shared/data/catalog-categories';
import { onImgErrorUseFallback, assetUrl } from '@shared/utils/asset-url';
import { formatToman } from '../shared/admin-format';

@Component({
  selector: 'app-inventory-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inventory-category.component.html',
  styleUrls: ['./inventory-category.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryCategoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly inventory = inject(AdminInventoryService);

  readonly formatToman = formatToman;
  readonly onImgError = onImgErrorUseFallback;

  readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') || '')),
    { initialValue: '' }
  );

  readonly category = computed(() => getCatalogCategoryBySlug(this.slug()));
  readonly products = computed(() => this.inventory.byCategorySlug(this.slug()));
  readonly heroImage = computed(() => assetUrl(this.category()?.image));
}
