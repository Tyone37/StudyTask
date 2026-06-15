import { Deadline } from './deadline.model';
import { Note } from './note.model';
import { Todo } from './todo.model';

export interface DashboardSummary {
  counts: {
    todos: number;
    incompleteTodos: number;
    notes: number;
    upcomingDeadlines: number;
    completionPercent: number;
  };
  recentTodos: Todo[];
  recentNotes: Note[];
  upcomingDeadlines: Deadline[];
}

