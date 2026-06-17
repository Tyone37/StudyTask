import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, catchError, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../models/dashboard.model';
import { User } from '../../models/user.model';
import { IconName } from '../../shared/icon.component';
import { DashboardCardComponent } from './dashboard-card.component';

interface DashboardViewModel {
  user: User | null;
  summary: DashboardSummary | null;
}

interface DashboardCard {
  title: string;
  value: number | string;
  description: string;
  icon: IconName;
  link: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, DashboardCardComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly dashboard = inject(DashboardService);
  error = '';

  readonly vm$: Observable<DashboardViewModel> = this.auth.currentUser$.pipe(
    switchMap((user) => {
      if (!user) {
        return of({ user: null, summary: null });
      }

      this.error = '';
      return this.dashboard.getSummary().pipe(
        map((summary) => ({ user, summary })),
        catchError((error: unknown) => {
          this.error = this.messageFromError(error);
          return of({ user, summary: null });
        })
      );
    })
  );

  cards(summary: DashboardSummary): DashboardCard[] {
    return [
      {
        title: 'Công việc cần làm',
        value: summary.counts.incompleteTodos,
        description: `${summary.counts.todos} todo trong danh sách`,
        icon: 'todo',
        link: '/todos'
      },
      {
        title: 'Ghi chú học tập',
        value: summary.counts.notes,
        description: 'Ý chính và tài liệu cần nhớ',
        icon: 'note',
        link: '/notes'
      },
      {
        title: 'Deadline sắp tới',
        value: summary.counts.upcomingDeadlines,
        description: 'Deadline chưa hoàn thành',
        icon: 'calendar',
        link: '/deadlines'
      },
      {
        title: 'Tiến độ hoàn thành',
        value: `${summary.counts.completionPercent}%`,
        description: 'Tính theo todo đã xong',
        icon: 'check',
        link: '/todos'
      }
    ];
  }

  notePreview(content: string): string {
    const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text || 'Không có nội dung';
  }

  private messageFromError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return String(error.error.message);
    }

    return 'Không tải được dashboard. Hãy kiểm tra backend và MySQL.';
  }
}
