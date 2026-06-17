import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TimeoutError, finalize, timeout } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, IconComponent, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.loading) {
      return;
    }

    this.error = '';

    if (!this.fullName.trim() || !this.email.trim() || this.password.length < 6) {
      this.error = 'Vui lòng nhập tên, email và mật khẩu ít nhất 6 ký tự.';
      return;
    }

    this.loading = true;
    this.auth
      .register({
        fullName: this.fullName,
        email: this.email,
        password: this.password
      })
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

  private messageFromError(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'Không nhận được phản hồi từ server. Hãy thử lại.';
    }

    if (error instanceof HttpErrorResponse) {
      const serverMessage = this.serverMessageFromError(error);
      if (serverMessage) {
        return serverMessage;
      }

      if (error.status === 409) {
        return 'Email đã tồn tại.';
      }
    }

    return 'Không đăng ký được. Hãy kiểm tra backend và MySQL.';
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
