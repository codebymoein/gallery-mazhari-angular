import { Component, OnInit, inject } from '@angular/core';

import { RouterLink } from '@angular/router';
import { SiteStyle, StylesApiService } from '@core/services/styles-api.service';

@Component({
  selector: 'app-looks',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './looks.component.html',
  styleUrls: ['./looks.component.css']
})
export class LooksComponent implements OnInit {
  private readonly api = inject(StylesApiService);
  looks: SiteStyle[] = [];
  loading = true;
  ngOnInit(): void {
    this.api.list().subscribe({ next: rows => { this.looks = rows; this.loading = false; }, error: () => this.loading = false });
  }
  cover(look: SiteStyle): string { return look.images?.[0] || look.coverImageUrl || 'assets/images/home-hero-bride.webp'; }
}
