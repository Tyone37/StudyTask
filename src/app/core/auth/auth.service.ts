import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';

import { ApiService } from '../api/api.service';
import { AuthResponse, User } from '../../models/user.model';
import '../../core/auth/google-identity.types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'study_tasks_token';
  private readonly userKey = 'study_tasks_user';
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.readStoredUser());

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isLoggedIn$ = this.currentUser$.pipe(map((user) => Boolean(user)));

  constructor(private readonly api: ApiService) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse, LoginRequest>('/auth/login', request, false)
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse, RegisterRequest>('/auth/register', request, false)
      .pipe(tap((response) => this.saveSession(response)));
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse, GoogleLoginRequest>('/auth/google', { idToken }, false)
      .pipe(tap((response) => this.saveSession(response)));
  }

  loadCurrentUser(): Observable<User | null> {
    if (!this.getToken()) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.api.get<User>('/me').pipe(
      tap((user) => this.saveUser(user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  logout(): void {
    const storage = this.storage();
    storage?.removeItem(this.tokenKey);
    storage?.removeItem(this.userKey);
    this.disableGoogleAutoSelect();
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.storage()?.getItem(this.tokenKey) || null;
  }

  private saveSession(response: AuthResponse): void {
    const storage = this.storage();
    storage?.setItem(this.tokenKey, response.token);
    storage?.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private saveUser(user: User): void {
    this.storage()?.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private readStoredUser(): User | null {
    const raw = this.storage()?.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch (_error) {
      return null;
    }
  }

  private storage(): Storage | null {
    try {
      return typeof window === 'undefined' ? null : window.localStorage;
    } catch (_error) {
      return null;
    }
  }

  private disableGoogleAutoSelect(): void {
    try {
      if (typeof window !== 'undefined') {
        window.google?.accounts?.id?.disableAutoSelect();
      }
    } catch (_error) {
      // Google Identity Services is optional and may not be loaded yet.
    }
  }
}
