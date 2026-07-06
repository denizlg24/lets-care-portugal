export type AdminAccessAction = "approve" | "deny" | "revoke" | "suspend" | "restore";

export interface AdminUserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
  isRoot: boolean;
}
