import { Injectable } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';

import { ApiService } from '../api/api.service';

export interface AppConfig {
  googleClientId: string;
  googleLoginEnabled: boolean;
}

const EMPTY_CONFIG: AppConfig = {
  googleClientId: '',
  googleLoginEnabled: false
};

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config$?: Observable<AppConfig>;

  constructor(private readonly api: ApiService) {}

  getConfig(): Observable<AppConfig> {
    this.config$ ??= this.api.get<AppConfig>('/config', false).pipe(
      catchError(() => of(EMPTY_CONFIG)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return this.config$;
  }
}
