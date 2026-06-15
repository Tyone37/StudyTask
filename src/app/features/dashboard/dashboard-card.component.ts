import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent, IconName } from '../../shared/icon.component';

@Component({
  selector: 'app-dashboard-card',
  standalone: true,
  imports: [IconComponent, RouterLink],
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.css'
})
export class DashboardCardComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) value: number | string = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) icon!: IconName;
  @Input({ required: true }) link = '/';
}

