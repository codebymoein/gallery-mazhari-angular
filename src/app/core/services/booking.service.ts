import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';

/**
 * Smart Booking Reminder — Telegram/SMS via NotificationService with offline queue fallback.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly notifications = inject(NotificationService);

  /**
   * Sends a booking-time reminder through the offline-capable notification layer.
   */
  simulateSmsReminder(phone: string, date: string | Date): void {
    const when =
      typeof date === 'string'
        ? date
        : date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

    this.notifications
      .sendBookingTime({
        name: 'مشتری',
        phone,
        bookingTime: when,
        note: 'یادآوری رزرو وقت مشاوره / پرو'
      })
      .subscribe({
        next: result => {
          console.log('[Gallery Mazhari · Booking Reminder]', result);
        },
        error: () => {
          // NotificationService already queues offline; swallow network errors.
        }
      });
  }
}
