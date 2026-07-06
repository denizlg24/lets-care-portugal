import "server-only";

import { ObjectId } from "mongodb";
import { ADMIN_ROLE, PENDING_ADMIN_ROLE, USER_ROLE } from "@/lib/admin/constants";
import { isRootAdminEmail } from "@/lib/admin/root";
import type { AdminAccessAction, AdminUserDTO } from "@/lib/admin/types";
import { auth, type Session } from "@/lib/auth";
import { db } from "@/lib/db/client";

interface AuthUserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  role?: string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AdminAccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const users = () => db.collection<AuthUserDocument>("user");
const accounts = () => db.collection("account");
const sessions = () => db.collection("session");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function dateToString(date: Date | undefined): string {
  return (date ?? new Date()).toISOString();
}

function hasRole(user: AuthUserDocument, role: string): boolean {
  return (user.role ?? USER_ROLE)
    .split(",")
    .map((item) => item.trim())
    .includes(role);
}

function toDTO(user: AuthUserDocument): AdminUserDTO {
  return {
    id: user._id.toHexString(),
    name: user.name,
    email: user.email,
    role: user.role ?? USER_ROLE,
    banned: user.banned === true,
    banReason: user.banReason ?? null,
    createdAt: dateToString(user.createdAt),
    updatedAt: dateToString(user.updatedAt),
    isRoot: isRootAdminEmail(user.email),
  };
}

export async function requestAdminAccess(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  const existing = await users().findOne({ email }, { projection: { _id: 1 } });
  if (existing) {
    return;
  }

  await auth.api.createUser({
    body: {
      email,
      name: input.name.trim(),
      password: input.password,
      role: PENDING_ADMIN_ROLE,
      data: { emailVerified: false },
    },
  });
}

export async function listAdminAccessUsers(): Promise<AdminUserDTO[]> {
  const result = await users()
    .find({
      $or: [
        { role: PENDING_ADMIN_ROLE },
        { role: ADMIN_ROLE },
        { role: { $regex: `(^|,)${ADMIN_ROLE}(,|$)` } },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();

  return result.map(toDTO);
}

async function deleteUser(id: ObjectId): Promise<void> {
  await Promise.all([
    sessions().deleteMany({ userId: id }),
    accounts().deleteMany({ userId: id }),
    users().deleteOne({ _id: id }),
  ]);
}

async function revokeUserSessions(id: ObjectId): Promise<void> {
  await sessions().deleteMany({ userId: id });
}

export async function applyAdminAccessAction(
  action: AdminAccessAction,
  userId: string,
  actor: Session,
): Promise<void> {
  const id = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
  if (!id) {
    throw new AdminAccessError(404, "Utilizador de administração não encontrado");
  }

  const target = await users().findOne({ _id: id });
  if (!target) {
    throw new AdminAccessError(404, "Utilizador de administração não encontrado");
  }

  if (target._id.toHexString() === actor.user.id || isRootAdminEmail(target.email)) {
    throw new AdminAccessError(
      400,
      "A conta do administrador principal não pode ser alterada aqui",
    );
  }

  const now = new Date();

  if (action === "approve") {
    if (!hasRole(target, PENDING_ADMIN_ROLE)) {
      throw new AdminAccessError(409, "Só é possível aprovar pedidos de administração pendentes");
    }

    await users().updateOne(
      { _id: id },
      {
        $set: {
          role: ADMIN_ROLE,
          banned: false,
          banReason: null,
          banExpires: null,
          updatedAt: now,
        },
      },
    );
    return;
  }

  if (action === "deny") {
    if (!hasRole(target, PENDING_ADMIN_ROLE)) {
      throw new AdminAccessError(409, "Só é possível recusar pedidos de administração pendentes");
    }

    await deleteUser(id);
    return;
  }

  if (!hasRole(target, ADMIN_ROLE)) {
    throw new AdminAccessError(409, "Só é possível gerir administradores existentes com esta ação");
  }

  if (action === "revoke") {
    await users().updateOne({ _id: id }, { $set: { role: USER_ROLE, updatedAt: now } });
    await revokeUserSessions(id);
    return;
  }

  if (action === "suspend") {
    await users().updateOne(
      { _id: id },
      {
        $set: {
          banned: true,
          banReason: "Acesso de administração suspenso pelo administrador principal",
          banExpires: null,
          updatedAt: now,
        },
      },
    );
    await revokeUserSessions(id);
    return;
  }

  if (action === "restore") {
    await users().updateOne(
      { _id: id },
      {
        $set: {
          banned: false,
          banReason: null,
          banExpires: null,
          updatedAt: now,
        },
      },
    );
  }
}
