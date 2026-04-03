export const roles = ["viewer", "analyst", "admin"] as const;

export type Role = (typeof roles)[number];

export const recordTypes = ["income", "expense"] as const;

export type RecordType = (typeof recordTypes)[number];

export type UserStatus = "active" | "inactive";

export interface JwtPayload {
  sub: number;
  role: Role;
  email: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
}

export interface PaginationResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
