import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';
import { Deadline } from '../../models/deadline.model';

@Injectable({ providedIn: 'root' })
export class DeadlineService {
  constructor(private readonly api: ApiService) {}

  getDeadlines(): Observable<Deadline[]> {
    return this.api.get<Deadline[]>('/deadlines');
  }

  addDeadline(title: string, dueDate: string): Observable<Deadline> {
    return this.api.post<Deadline, { title: string; dueDate: string }>('/deadlines', {
      title,
      dueDate
    });
  }

  updateDeadline(deadline: Deadline): Observable<Deadline> {
    return this.api.patch<Deadline, Partial<Deadline>>(`/deadlines/${deadline.id}`, deadline);
  }
}

