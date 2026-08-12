import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DreamCanvasService } from '@core/services/dream-canvas.service';
import { ConsultationService } from '@core/services/consultation.service';
import { BridalPreferenceProfile, BridalPreferenceService } from '@core/services/bridal-preference.service';
import { DrawerService } from '@core/services/drawer.service';

@Component({
  selector: 'app-dream-canvas', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dream-canvas.component.html', styleUrls: ['./dream-canvas.component.css']
})
export class DreamCanvasComponent {
  readonly canvas = inject(DreamCanvasService);
  private readonly consultations = inject(ConsultationService);
  private readonly preferences = inject(BridalPreferenceService);
  private readonly drawer = inject(DrawerService);
  lastName = ''; phone = ''; submitting = false; sent = false; error = '';
  constructor() { this.drawer.close(); }
  profile: BridalPreferenceProfile = { bodyShape: '', faceShape: '', styles: [], ceremony: '', priorities: [], brideHeight: undefined, groomHeight: undefined };
  readonly styles = [{id:'european',label:'اروپایی و مینیمال'},{id:'arabic',label:'عربی و پرکار'},{id:'classic',label:'کلاسیک'},{id:'modern',label:'مدرن'},{id:'romantic',label:'رمانتیک'},{id:'royal',label:'سلطنتی'}];

  toggle(list: string[], value: string): void {
    const i = list.indexOf(value);
    if (i < 0) {
      list.push(value);
    } else {
      list.splice(i, 1);
    }
  }
  selected(list: string[], value: string): boolean { return list.includes(value); }
  submit(): void {
    if (!/^09\d{9}$/.test(this.phone.replace(/\D/g,''))) { this.error='شماره موبایل را به‌صورت 09xxxxxxxxx وارد کنید.'; return; }
    const tags=this.preferences.save(this.profile); this.submitting=true; this.error='';
    this.consultations.submitPotentialLead({ lastName:this.lastName, phone:this.phone, profile:this.profile, desiredTags:tags }).subscribe({
      next:()=>{this.submitting=false;this.sent=true;}, error:()=>{this.submitting=false;this.error='ثبت اطلاعات انجام نشد؛ اتصال سرور را بررسی کنید.';}
    });
  }
}
