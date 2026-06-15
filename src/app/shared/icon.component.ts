import { Component, Input } from '@angular/core';

export type IconName =
  | 'calendar'
  | 'check'
  | 'dashboard'
  | 'login'
  | 'logout'
  | 'note'
  | 'plus'
  | 'todo'
  | 'trash'
  | 'user';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css'
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
}

