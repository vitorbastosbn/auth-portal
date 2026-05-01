import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RegisterRequest } from '../models/auth.models';
import {
  AdminUserListParams,
  AdminUserResponse,
  UpdateAdminUserRequest,
} from '../models/admin-user.models';
import { PageResponse } from '../models/client-service.models';

export interface CreatedUser {
  userId: string;
  username: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);

  listUsers(params?: AdminUserListParams): Observable<PageResponse<AdminUserResponse>> {
    let httpParams = new HttpParams();
    if (params?.query) httpParams = httpParams.set('query', params.query);
    if (params?.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params?.size !== undefined) httpParams = httpParams.set('size', String(params.size));

    return this.http.get<PageResponse<AdminUserResponse>>('/api/v1/users', {
      params: httpParams,
    });
  }

  updateUser(userId: string, payload: UpdateAdminUserRequest): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(`/api/v1/users/${userId}`, payload);
  }

  register(payload: RegisterRequest): Observable<CreatedUser> {
    return this.http.post<Record<string, unknown>>('/api/v1/auth/register', payload).pipe(
      map((res) => {
        // O endpoint retorna accessToken — extraímos os dados do JWT
        const rawToken = (res['accessToken'] ?? res['access_token'] ?? '') as string;
        let userId = (res['userId'] ?? res['uid'] ?? '') as string;
        let username = (res['username'] ?? '') as string;
        const email = payload.email;

        if (rawToken) {
          try {
            const base64 = rawToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
            const jwtPayload = JSON.parse(atob(padded)) as Record<string, unknown>;
            userId = (jwtPayload['uid'] ?? jwtPayload['userId'] ?? jwtPayload['sub'] ?? userId) as string;
            username = (jwtPayload['username'] ?? jwtPayload['sub'] ?? username) as string;
          } catch {
            // fallback to whatever the response body provided
          }
        }

        return { userId: String(userId), username: String(username || payload.username), email };
      }),
    );
  }
}
