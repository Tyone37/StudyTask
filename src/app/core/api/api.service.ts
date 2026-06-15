import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:3000/api';
  private readonly tokenKey = 'study_tasks_token';

  constructor(private readonly http: HttpClient) {}

  get<T>(path: string, withAuth = true): Observable<T> {
    return this.http.get<T>(this.url(path), {
      headers: this.headers(withAuth)
    });
  }

  post<T, B = unknown>(path: string, body: B, withAuth = true): Observable<T> {
    return this.http.post<T>(this.url(path), body, {
      headers: this.headers(withAuth)
    });
  }

  patch<T, B = unknown>(path: string, body: B): Observable<T> {
    return this.http.patch<T>(this.url(path), body, {
      headers: this.headers(true)
    });
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path), {
      headers: this.headers(true)
    });
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private headers(withAuth: boolean): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.readToken();

    if (withAuth && token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private readToken(): string | null {
    try {
      return typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(this.tokenKey);
    } catch (_error) {
      return null;
    }
  }
}

