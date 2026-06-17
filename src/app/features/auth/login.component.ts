import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TimeoutError, finalize, timeout } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { GoogleCredentialResponse } from '../../core/auth/google-identity.types';
import { AppConfigService } from '../../core/config/app-config.service';
import { IconComponent } from '../../shared/icon.component';

type GoogleButtonStatus = 'loading' | 'ready' | 'not-configured' | 'unavailable';

let googleScriptLoad: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In requires a browser.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptLoad) {
    return googleScriptLoad;
  }

  googleScriptLoad = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const script = existing ?? document.createElement('script');

    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Could not load Google Sign-In.')), {
      once: true
    });

    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return googleScriptLoad;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IconComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('emailInput') private readonly emailInput?: ElementRef<HTMLInputElement>;
  @ViewChild('googleButton') private readonly googleButton?: ElementRef<HTMLDivElement>;
  @ViewChild('passwordInput') private readonly passwordInput?: ElementRef<HTMLInputElement>;

  email = '';
  password = '';
  loading = false;
  googleLoading = false;
  googleStatus: GoogleButtonStatus = 'loading';
  error = '';
  private destroyed = false;
  private clearFieldTimeouts: number[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly config: AppConfigService,
    private readonly ngZone: NgZone,
    private readonly router: Router
  ) {}

  ngAfterViewInit(): void {
    this.clearLoginFieldsSoon();

    this.config.getConfig().subscribe({
      next: (config) => {
        if (this.destroyed) {
          return;
        }

        if (!config.googleLoginEnabled || !config.googleClientId) {
          this.googleStatus = 'not-configured';
          return;
        }

        loadGoogleScript()
          .then(() => {
            this.ngZone.run(() => this.renderGoogleButton(config.googleClientId));
          })
          .catch(() => {
            this.ngZone.run(() => {
              this.googleStatus = 'unavailable';
            });
          });
      },
      error: () => {
        this.googleStatus = 'unavailable';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    for (const timeout of this.clearFieldTimeouts) {
      window.clearTimeout(timeout);
    }
  }

  submit(): void {
    if (this.loading || this.googleLoading) {
      return;
    }

    this.error = '';

    if (!this.email.trim() || !this.password) {
      this.error = 'Vui lòng nhập email và mật khẩu.';
      return;
    }

    this.loading = true;
    this.auth
      .login({ email: this.email, password: this.password })
      .pipe(timeout({ first: 10000 }))
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: (error: unknown) => {
          this.showError(error);
        }
      });
  }

  private renderGoogleButton(clientId: string): void {
    const target = this.googleButton?.nativeElement;
    const googleId = window.google?.accounts?.id;

    if (!target || !googleId) {
      this.googleStatus = 'unavailable';
      return;
    }

    target.innerHTML = '';
    try {
      googleId.disableAutoSelect();
      googleId.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (response) => {
          this.ngZone.run(() => this.handleGoogleCredential(response));
        }
      });
      this.googleStatus = 'ready';
      this.cdr.detectChanges();
      googleId.renderButton(target, {
        theme: 'outline',
        // GIS does not show personalized account chips for medium or small buttons.
        size: 'medium',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        locale: 'vi',
        width: Math.min(360, target.clientWidth || 320)
      });
    } catch (_error) {
      this.googleStatus = 'unavailable';
      this.cdr.detectChanges();
    }
  }

  private handleGoogleCredential(response: GoogleCredentialResponse): void {
    if (this.googleLoading || this.loading) {
      return;
    }

    if (!response.credential) {
      this.error = 'Không nhận được Google ID token.';
      return;
    }

    this.error = '';
    this.googleLoading = true;
    this.auth
      .loginWithGoogle(response.credential)
      .pipe(timeout({ first: 10000 }))
      .pipe(finalize(() => {
        this.googleLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: () => {
          void this.router.navigate(['/']);
        },
        error: (error: unknown) => {
          this.showError(error);
        }
      });
  }

  private clearLoginFieldsSoon(): void {
    this.clearLoginFields();
    for (const delay of [100, 500]) {
      this.clearFieldTimeouts.push(window.setTimeout(() => this.clearLoginFields(), delay));
    }
  }

  private clearLoginFields(): void {
    if (this.destroyed) {
      return;
    }

    const emailInput = this.emailInput?.nativeElement;
    const passwordInput = this.passwordInput?.nativeElement;
    const activeElement = document.activeElement;

    if (activeElement === emailInput || activeElement === passwordInput) {
      return;
    }

    this.email = '';
    this.password = '';

    if (emailInput) {
      emailInput.value = '';
    }

    if (passwordInput) {
      passwordInput.value = '';
    }

    this.cdr.detectChanges();
  }

  private messageFromError(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Không nhận được phản hồi từ server. Hãy thử lại.';
    }

    if (error instanceof HttpErrorResponse) {
      const serverMessage = this.serverMessageFromError(error);
      if (serverMessage) {
        return serverMessage;
      }

      if (error.status === 401) {
        return 'Email hoặc mật khẩu không đúng.';
      }

      if (error.status === 409) {
        return 'Không thể đăng nhập bằng Google với email này.';
      }
    }

    return 'Không đăng nhập được. Hãy kiểm tra backend, MySQL và cấu hình Google.';
  }

  private showError(error: unknown): void {
    this.error = this.messageFromError(error);
    this.cdr.detectChanges();
  }

  private serverMessageFromError(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error.trim();
    }

    const body = error.error as { message?: unknown } | null;
    return typeof body?.message === 'string' ? body.message : '';
  }
}
