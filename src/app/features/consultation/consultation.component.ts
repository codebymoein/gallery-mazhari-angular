import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HomeAppointmentComponent } from '../home/components/home-appointment/home-appointment.component';

@Component({
  selector: 'app-consultation',
  standalone: true,
  imports: [HomeAppointmentComponent],
  template: `
    <app-home-appointment
      sectionId="consultation"
      source="website"
      [productName]="productName"
      [productId]="productId"
    />
  `,
  styles: [`
    :host {
      display: block;
      padding-block-start: 1rem;
    }
  `]
})
export class ConsultationComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private sub?: Subscription;

  productName = '';
  productId = '';

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe(params => {
      this.productName = params.get('product')?.trim() || '';
      this.productId = params.get('productId')?.trim() || '';
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
