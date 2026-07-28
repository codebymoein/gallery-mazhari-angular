import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConsultationFormComponent } from '@shared/components/consultation-form/consultation-form.component';
import { ConsultationSource } from '@shared/data/consultation-options';

@Component({
  selector: 'app-home-appointment',
  standalone: true,
  imports: [CommonModule, ConsultationFormComponent],
  templateUrl: './home-appointment.component.html',
  styleUrls: ['./home-appointment.component.css']
})
export class HomeAppointmentComponent implements OnChanges {
  private readonly router = inject(Router);

  @Input() sectionId = 'appointment';
  @Input() source: ConsultationSource = 'homepage';
  @Input() productName = '';
  @Input() productId = '';

  formClosed = false;

  readonly introImage = 'assets/images/home-complete-selection.webp';

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
