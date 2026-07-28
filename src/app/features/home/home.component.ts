import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CategoryShowcaseComponent } from './components/category-showcase/category-showcase.component';
import { LookbookMatchmakerComponent } from './components/lookbook-matchmaker/lookbook-matchmaker.component';
import { RealBridesComponent } from './components/real-brides/real-brides.component';
import { HomeAppointmentComponent } from './components/home-appointment/home-appointment.component';
import { TrustGuaranteesComponent } from './components/trust-guarantees/trust-guarantees.component';
import { InteractiveGuideFaqComponent } from './components/interactive-guide-faq/interactive-guide-faq.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CategoryShowcaseComponent,
    LookbookMatchmakerComponent,
    RealBridesComponent,
    HomeAppointmentComponent,
    InteractiveGuideFaqComponent,
    TrustGuaranteesComponent
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  bridalImage    = 'assets/images/home-hero-bride.webp';
  accessoryImage = 'assets/images/bridal-hair-accessories.webp';
}
