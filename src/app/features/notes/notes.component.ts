import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NoteService } from '../../core/services/note.service';
import { Note } from '../../models/note.model';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-notes',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css'
})
export class NotesComponent implements OnInit {
  notes: Note[] = [];
  title = '';
  content = '';
  loading = false;
  error = '';

  constructor(
    private readonly noteService: NoteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.loading = true;
    this.error = '';

    this.noteService.getNotes().subscribe({
      next: (notes) => {
        this.notes = notes;
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

  addNote(): void {
    const title = this.title.trim();
    const content = this.content.trim();

    if (!title) {
      return;
    }

    this.noteService.addNote(title, content).subscribe({
      next: (note) => {
        this.notes = [note, ...this.notes];
        this.title = '';
        this.content = '';
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  deleteNote(id: number): void {
    this.noteService.deleteNote(id).subscribe({
      next: () => {
        this.notes = this.notes.filter((note) => note.id !== id);
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

    return 'Không tải được ghi chú. Hãy đăng nhập và kiểm tra backend.';
  }
}
