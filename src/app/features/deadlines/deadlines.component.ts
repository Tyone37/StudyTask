import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DeadlineService } from '../../core/services/deadline.service';
import { Deadline } from '../../models/deadline.model';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-deadlines',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './deadlines.component.html',
  styleUrl: './deadlines.component.css'
})
export class DeadlinesComponent implements OnInit {
  deadlines: Deadline[] = [];
  title = '';
  dueDate = '';
  loading = false;
  error = '';

  constructor(
    private readonly deadlineService: DeadlineService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDeadlines();
  }

  loadDeadlines(): void {
    this.loading = true;
    this.error = '';

    this.deadlineService.getDeadlines().subscribe({
      next: (deadlines) => {
        this.deadlines = deadlines;
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

  addDeadline(): void {
    const title = this.title.trim();
    const dueDate = this.dueDate.trim();

    if (!title || !dueDate) {
      return;
    }

    this.deadlineService.addDeadline(title, dueDate).subscribe({
      next: (deadline) => {
        this.deadlines = [...this.deadlines, deadline].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        this.title = '';
        this.dueDate = '';
        this.cdr.detectChanges();
      },
      error: (error: unknown) => {
        this.error = this.messageFromError(error);
        this.cdr.detectChanges();
      }
    });
  }

  toggleDone(deadline: Deadline): void {
    this.deadlineService.updateDeadline({ ...deadline, done: !deadline.done }).subscribe({
      next: (updated) => {
        this.deadlines = this.deadlines.map((item) => item.id === updated.id ? updated : item);
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

    return 'Không tải được deadline. Hãy đăng nhập và kiểm tra backend.';
  }
}
