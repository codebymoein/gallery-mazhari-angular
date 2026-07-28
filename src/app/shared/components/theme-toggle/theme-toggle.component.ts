import {
  Component, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  protected theme = inject(ThemeService);
}
