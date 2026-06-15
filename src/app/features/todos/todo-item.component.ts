import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Todo } from '../../models/todo.model';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css'
})
export class TodoItemComponent {
  @Input({ required: true }) todo!: Todo;
  @Output() toggle = new EventEmitter<Todo>();
  @Output() remove = new EventEmitter<number>();
}

