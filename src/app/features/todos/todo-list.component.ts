import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TodoService } from '../../core/services/todo.service';
import { Todo } from '../../models/todo.model';
import { IconComponent } from '../../shared/icon.component';
import { TodoItemComponent } from './todo-item.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [FormsModule, IconComponent, TodoItemComponent],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css'
})
export class TodoListComponent implements OnInit {
  todos: Todo[] = [];
  newTitle = '';
  loading = false;
  error = '';

  constructor(
    private readonly todoService: TodoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos(): void {
    this.loading = true;
    this.error = '';

    this.todoService.getTodos().subscribe({
      next: (todos) => {
        this.todos = todos;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addTodo(): void {
    const title = this.newTitle.trim();
    if (!title) {
      return;
    }

    this.todoService.addTodo(title).subscribe({
      next: (todo) => {
        this.todos = [todo, ...this.todos];
        this.newTitle = '';
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  toggleTodo(todo: Todo): void {
    this.todoService.updateTodo({ ...todo, completed: !todo.completed }).subscribe({
      next: (updated) => {
        this.todos = this.todos.map((item) => item.id === updated.id ? updated : item);
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  deleteTodo(id: number): void {
    this.todoService.deleteTodo(id).subscribe({
      next: () => {
        this.todos = this.todos.filter((todo) => todo.id !== id);
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return String(error.error.message);
    }

    return 'Không tải được todo. Hãy đăng nhập và kiểm tra backend.';
  }
}
