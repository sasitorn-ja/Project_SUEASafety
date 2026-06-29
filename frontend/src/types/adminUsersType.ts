export type AdminRole = {
  id: string | number;
  code: string;
  name?: string;
};

export type AdminUser = {
  id: string | number;
  employee_no?: string | null;
  email?: string | null;
  name_th?: string | null;
  name_en?: string | null;
  position_name?: string | null;
  status?: string | null;
  roles?: AdminRole[];
  role_codes?: string[];
};

export type AdminUsersListPayload<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminUsersQuery = {
  page: number;
  pageSize: number;
  search?: string;
};

export type UpdateUserRolesPayload = {
  roleIds: string[];
};
