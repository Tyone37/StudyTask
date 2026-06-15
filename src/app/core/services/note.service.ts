import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';
import { Note } from '../../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  constructor(private readonly api: ApiService) {}

  getNotes(): Observable<Note[]> {
    return this.api.get<Note[]>('/notes');
  }

  addNote(title: string, content: string): Observable<Note> {
    return this.api.post<Note, { title: string; content: string }>('/notes', {
      title,
      content
    });
  }

  deleteNote(id: number): Observable<void> {
    return this.api.delete<void>(`/notes/${id}`);
  }
}

