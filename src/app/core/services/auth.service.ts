import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  MessageResponse,
  UserProfileResponse,
} from '../models/auth.models';
import { TokenService } from './token.service';

const BASE = '/api/v1/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  readonly currentUser = signal<{ userId: string; username: string; roles: string[] } | null>(
    this.tokenService.getUserFromToken(),
  );

  readonly isAuthenticated = signal<boolean>(
    !!this.tokenService.getAccessToken() && !this.tokenService.isTokenExpired(),
  );

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/login`, payload).pipe(
      tap((auth) => {
        this.tokenService.saveTokens(auth);
        this.currentUser.set(this.tokenService.getUserFromToken());
        this.isAuthenticated.set(true);
      }),
    );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.http
        .post<MessageResponse>(`${BASE}/logout`, { refreshToken })
        .subscribe({ error: () => {} });
    }
    this.tokenService.clearTokens();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.tokenService.getRefreshToken()!;
    return this.http.post<AuthResponse>(`${BASE}/refresh`, { refreshToken }).pipe(
      tap((auth) => {
        this.tokenService.saveTokens(auth);
        this.currentUser.set(this.tokenService.getUserFromToken());
        this.isAuthenticated.set(true);
      }),
    );
  }

  me(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${BASE}/me`);
  }

  isAdmin(): boolean {
    return this.tokenService.isAdmin();
  }
}
