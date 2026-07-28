import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vip-booking-cta',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vip-booking-cta.component.html',
  styleUrls: ['./vip-booking-cta.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VipBookingCtaComponent {}
