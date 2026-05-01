import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import {
  AssignUserToClientRequest,
  AssignableUserListParams,
  AssignableUserResponse,
  ClientServiceListParams,
  ClientServiceResponse,
  ClientServiceRoleResponse,
  ClientUserListParams,
  ClientUserMembershipResponse,
  CreateClientServiceRequest,
  CreateClientServiceRoleRequest,
  PageResponse,
  UpdateClientServiceRequest,
  UpdateClientServiceRoleRequest,
  UpdateClientUserRequest,
} from '../models/client-service.models';

const BASE = '/api/v1/client-services';

@Injectable({ providedIn: 'root' })
export class ClientServiceService {
  private readonly http = inject(HttpClient);

  // --- Services ---
  list(params?: ClientServiceListParams): Observable<PageResponse<ClientServiceResponse>> {
    let httpParams = new HttpParams();
    if (params?.query) httpParams = httpParams.set('query', params.query);
    if (params?.active !== undefined) httpParams = httpParams.set('active', String(params.active));
    if (params?.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params?.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PageResponse<ClientServiceResponse>>(BASE, { params: httpParams });
  }

  getById(id: string): Observable<ClientServiceResponse> {
    return this.http.get<ClientServiceResponse>(`${BASE}/${id}`);
  }

  create(payload: CreateClientServiceRequest): Observable<ClientServiceResponse> {
    return this.http.post<ClientServiceResponse>(BASE, payload);
  }

  update(id: string, payload: UpdateClientServiceRequest): Observable<ClientServiceResponse> {
    return this.http.put<ClientServiceResponse>(`${BASE}/${id}`, payload);
  }

  // --- Roles ---
  listRoles(serviceId: string): Observable<ClientServiceRoleResponse[]> {
    return this.http.get<ClientServiceRoleResponse[]>(`${BASE}/${serviceId}/roles`);
  }

  createRole(
    serviceId: string,
    payload: CreateClientServiceRoleRequest,
  ): Observable<ClientServiceRoleResponse> {
    return this.http.post<ClientServiceRoleResponse>(`${BASE}/${serviceId}/roles`, payload);
  }

  updateRole(
    serviceId: string,
    roleId: string,
    payload: UpdateClientServiceRoleRequest,
  ): Observable<ClientServiceRoleResponse> {
    return this.http.put<ClientServiceRoleResponse>(
      `${BASE}/${serviceId}/roles/${roleId}`,
      payload,
    );
  }

  deleteRole(serviceId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${serviceId}/roles/${roleId}`);
  }

  // --- Users (Memberships) ---
  listUsers(serviceId: string, params?: ClientUserListParams): Observable<PageResponse<ClientUserMembershipResponse>> {
    let httpParams = new HttpParams();
    if (params?.query) httpParams = httpParams.set('query', params.query);
    if (params?.active !== undefined) httpParams = httpParams.set('active', String(params.active));
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params?.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PageResponse<ClientUserMembershipResponse>>(`${BASE}/${serviceId}/users`, { params: httpParams });
  }

  listAssignableUsers(
    serviceId: string,
    params?: AssignableUserListParams,
  ): Observable<PageResponse<AssignableUserResponse>> {
    let httpParams = new HttpParams();
    if (params?.query) httpParams = httpParams.set('query', params.query);
    if (params?.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params?.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PageResponse<AssignableUserResponse>>(
      `${BASE}/${serviceId}/users/available`,
      { params: httpParams },
    );
  }

  assignUser(
    serviceId: string,
    payload: AssignUserToClientRequest,
  ): Observable<ClientUserMembershipResponse> {
    return this.http.post<ClientUserMembershipResponse>(
      `${BASE}/${serviceId}/users/assignments`,
      payload,
    );
  }

  updateUserMembership(
    serviceId: string,
    userId: string,
    payload: UpdateClientUserRequest,
  ): Observable<ClientUserMembershipResponse> {
    return this.http.put<ClientUserMembershipResponse>(
      `${BASE}/${serviceId}/users/${userId}`,
      payload,
    );
  }

  removeUser(serviceId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${serviceId}/users/${userId}`);
  }
}
