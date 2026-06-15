export interface GoogleCredentialResponse {
  credential?: string;
}

export interface GoogleInitializeOptions {
  client_id: string;
  auto_select: boolean;
  callback: (response: GoogleCredentialResponse) => void;
}

export interface GoogleButtonOptions {
  theme: 'outline';
  size: 'medium' | 'large';
  type: 'standard';
  text: 'signin_with';
  shape: 'rectangular';
  logo_alignment: 'left';
  locale: string;
  width: number;
}

export interface GoogleIdApi {
  initialize(options: GoogleInitializeOptions): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
  disableAutoSelect(): void;
}

export interface GoogleAccounts {
  accounts?: {
    id?: GoogleIdApi;
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}
