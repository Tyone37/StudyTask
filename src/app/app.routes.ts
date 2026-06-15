import { Routes } from '@angular/router';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DeadlinesComponent } from './features/deadlines/deadlines.component';
import { LoginComponent } from './features/auth/login.component';
import { NotesComponent } from './features/notes/notes.component';
import { RegisterComponent } from './features/auth/register.component';
import { TodoListComponent } from './features/todos/todo-list.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'todos', component: TodoListComponent },
  { path: 'notes', component: NotesComponent },
  { path: 'deadlines', component: DeadlinesComponent },
  { path: '**', redirectTo: '' }
];

