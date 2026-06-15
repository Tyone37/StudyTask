import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';
import { Todo } from '../../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  constructor(private readonly api: ApiService) {}

  getTodos(): Observable<Todo[]> {
    return this.api.get<Todo[]>('/todos');
  }

  addTodo(title: string): Observable<Todo> {
    return this.api.post<Todo, { title: string }>('/todos', { title });
  }

  updateTodo(todo: Todo): Observable<Todo> {
    return this.api.patch<Todo, Partial<Todo>>(`/todos/${todo.id}`, todo);
  }

  deleteTodo(id: number): Observable<void> {
    return this.api.delete<void>(`/todos/${id}`);
  }
}

