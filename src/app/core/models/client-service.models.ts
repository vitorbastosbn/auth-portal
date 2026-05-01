export interface ClientServiceResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface CreateClientServiceRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateClientServiceRequest {
  name: string;
  description?: string;
  active?: boolean;
}

export interface ClientServiceRoleResponse {
  id: string;
  code: string;
  description: string;
  active: boolean;
}

export interface CreateClientServiceRoleRequest {
  code: string;
  description?: string;
  active?: boolean;
}

export interface UpdateClientServiceRoleRequest {
  description?: string;
  active?: boolean;
}

export interface ClientUserMembershipResponse {
  userId: string;
  username: string;
  email: string;
  roles: string[];
  active: boolean;
}

export interface AssignUserToClientRequest {
  userId: string;
  roles: string[];
  active?: boolean;
}

export interface UpdateClientUserRequest {
  roles: string[];
  active?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ClientServiceListParams {
  query?: string;
  active?: boolean;
  page?: number;
  size?: number;
}

export interface ClientUserListParams {
  query?: string;
  active?: boolean;
  role?: string;
  page?: number;
  size?: number;
}

export interface AssignableUserResponse {
  userId: string;
  username: string;
  email: string;
}

export interface AssignableUserListParams {
  query?: string;
  page?: number;
  size?: number;
}
