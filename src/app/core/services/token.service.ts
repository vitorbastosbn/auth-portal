import { Injectable } from '@angular/core';
import { AuthResponse } from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

interface JwtPayload {
  sub?: string;
  uid?: string;
  userId?: string;
  username?: string;
  role?: string[] | string;
  roles?: string[];
  authorities?: Array<string | { authority?: string }>;
  scope?: string;
  scp?: string[] | string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private sanitizeToken(rawToken: unknown): string {
    if (typeof rawToken !== 'string') return '';
    return rawToken.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '').trim();
  }

  private getAccessTokenFromResponse(auth: AuthResponse): string {
    const payload = auth as unknown as Record<string, unknown>;
    const candidates = [
      payload['accessToken'],
      payload['access_token'],
      payload['token'],
      payload['jwt'],
    ];

    for (const candidate of candidates) {
      const token = this.sanitizeToken(candidate);
      if (token) return token;
    }

    return '';
  }

  private getRefreshTokenFromResponse(auth: AuthResponse): string {
    const payload = auth as unknown as Record<string, unknown>;
    const candidates = [payload['refreshToken'], payload['refresh_token']];

    for (const candidate of candidates) {
      const token = this.sanitizeToken(candidate);
      if (token) return token;
    }

    return '';
  }

  private normalizeRoles(input: string[]): string[] {
    const unique = new Set(
      input
        .map((v) => v?.trim())
        .filter((v): v is string => !!v)
        .map((v) => v.toUpperCase()),
    );

    // Garante compatibilidade entre ADMIN e ROLE_ADMIN
    if (unique.has('ADMIN')) {
      unique.add('ROLE_ADMIN');
    }
    if (unique.has('ROLE_ADMIN')) {
      unique.add('ADMIN');
    }

    return Array.from(unique);
  }

  private toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      const asStrings = value
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'authority' in item) {
            const authority = (item as { authority?: unknown }).authority;
            return typeof authority === 'string' ? authority : null;
          }
          return null;
        })
        .filter((v): v is string => !!v);
      return this.normalizeRoles(asStrings);
    }

    if (typeof value === 'string') {
      return this.normalizeRoles(
        value
          .split(/[\s,]+/)
          .map((v) => v.trim())
          .filter(Boolean),
      );
    }

    return [];
  }

  getAccessToken(): string | null {
    const rawToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    return rawToken ? this.sanitizeToken(rawToken) : null;
  }

  getRefreshToken(): string | null {
    const rawToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return rawToken ? this.sanitizeToken(rawToken) : null;
  }

  saveTokens(auth: AuthResponse): void {
    const accessToken = this.getAccessTokenFromResponse(auth);
    if (!accessToken) {
      throw new Error('Resposta de login sem access token');
    }

    const refreshToken = this.getRefreshTokenFromResponse(auth);
    if (!refreshToken) {
      throw new Error('Resposta de login sem refresh token');
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    const payload = this.decodeTokenPayload(accessToken);
    const userId = payload?.userId ?? payload?.uid ?? '';
    const username = payload?.username ?? payload?.sub ?? '';
    const roles = this.getRolesFromTokenPayload(payload);

    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ userId, username, roles }),
    );
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getStoredUser(): { userId: string; username: string; roles: string[] } | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Decodifica o payload do JWT sem verificar a assinatura.
   * A verificação de assinatura é responsabilidade do backend.
   */
  decodeTokenPayload(token: string): JwtPayload | null {
    try {
      const normalizedToken = this.sanitizeToken(token);
      const parts = normalizedToken.split('.');
      if (parts.length !== 3) return null;

      // Base64Url → Base64 → JSON
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const jsonStr = atob(padded);
      return JSON.parse(jsonStr) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Extrai as roles diretamente do access token armazenado.
   * Suporta os claims `roles` e `authorities` (Spring Security).
   */
  private getRolesFromTokenPayload(payload: JwtPayload | null): string[] {
    if (!payload) return [];
    const collected = new Set<string>();

    this.toStringArray(payload.roles).forEach((r) => collected.add(r));
    this.toStringArray(payload.role).forEach((r) => collected.add(r));
    this.toStringArray(payload.authorities).forEach((r) => collected.add(r));
    this.toStringArray(payload.scope).forEach((r) => collected.add(r));
    this.toStringArray(payload.scp).forEach((r) => collected.add(r));

    this.toStringArray(payload.realm_access?.roles).forEach((r) => collected.add(r));

    if (payload.resource_access && typeof payload.resource_access === 'object') {
      Object.values(payload.resource_access).forEach((entry) => {
        this.toStringArray(entry?.roles).forEach((r) => collected.add(r));
      });
    }

    return Array.from(collected);
  }

  getRolesFromToken(): string[] {
    const token = this.getAccessToken();
    if (!token) return this.getStoredUser()?.roles ?? [];

    const payload = this.decodeTokenPayload(token);
    const roles = this.getRolesFromTokenPayload(payload);
    return roles.length > 0 ? roles : (this.getStoredUser()?.roles ?? []);
  }

  getUserFromToken(): { userId: string; username: string; roles: string[] } | null {
    const token = this.getAccessToken();
    if (!token) return this.getStoredUser();

    const payload = this.decodeTokenPayload(token);
    if (!payload) return this.getStoredUser();

    return {
      userId: payload.userId ?? payload.uid ?? '',
      username: payload.username ?? payload.sub ?? '',
      roles: this.getRolesFromTokenPayload(payload),
    };
  }

  /**
   * Verifica se o access token está expirado com base no claim `exp`.
   */
  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) return true;

    // exp é em segundos; Date.now() em milissegundos
    return Date.now() >= payload.exp * 1000;
  }

  isAdmin(): boolean {
    const roles = this.getRolesFromToken();
    return roles.includes('ROLE_ADMIN') || roles.includes('ADMIN');
  }
}
