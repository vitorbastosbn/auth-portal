export interface AdminUserResponse {
  userId: string;
  username: string;
  email: string;
  active: boolean;
}

export interface AdminUserListParams {
  query?: string;
  page?: number;
  size?: number;
}

export interface UpdateAdminUserRequest {
  username: string;
  email: string;
  active: boolean;
}
