import { Component, Input, OnChanges, SimpleChanges, computed, inject } from '@angular/core';

import { Router } from '@angular/router';
import { ConsultationFormComponent } from '@shared/components/consultation-form/consultation-form.component';
import { ConsultationSource } from '@shared/data/consultation-options';
import { AppearanceApiService } from '@core/services/appearance-api.service';
import { assetUrl } from '@shared/utils/asset-url';

@Component({
  selector: 'app-home-appointment',
  standalone: true,
  imports: [ConsultationFormComponent],
  templateUrl: './home-appointment.component.html',
  styleUrls: ['./home-appointment.component.css']
})
export class HomeAppointmentComponent implements OnChanges {
  private readonly router = inject(Router);
  private readonly appearance = inject(AppearanceApiService);

  @Input() sectionId = 'appointment';
  @Input() source: ConsultationSource = 'homepage';
  @Input() productName = '';
  @Input() productId = '';

  formClosed = false;

  readonly introImage = computed(() =>
    this.appearance.appearance()?.consultationImage ||
    assetUrl('assets/images/home-complete-selection.webp')
  );

  constructor() {
    this.appearance.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productName'] || changes['productId']) {
      this.formClosed = false;
    }
  }

  onFormCompleted(): void {
    const productId = this.productId.trim();

    if (productId) {
      void this.router.navigate(['/product', productId]);
      return;
    }

    if (this.source === 'website') {
      void this.router.navigate(['/'], { fragment: 'appointment' });
      return;
    }

    this.formClosed = true;
  }
}
