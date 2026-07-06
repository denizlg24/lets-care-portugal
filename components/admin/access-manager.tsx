"use client";

import { AlertCircle, Ban, Check, RotateCcw, ShieldOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE, PENDING_ADMIN_ROLE } from "@/lib/admin/constants";
import type { AdminAccessAction, AdminUserDTO } from "@/lib/admin/types";

interface AccessManagerProps {
  users: AdminUserDTO[];
  canManage: boolean;
  rootConfigured: boolean;
  currentUserId: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function roleLabel(user: AdminUserDTO): string {
  if (user.role === PENDING_ADMIN_ROLE) return "Pendente";
  if (user.banned) return "Suspenso";
  if (user.isRoot) return "Admin. principal";
  return "Admin.";
}

function roleVariant(user: AdminUserDTO): "default" | "secondary" | "outline" | "destructive" {
  if (user.banned) return "destructive";
  if (user.role === PENDING_ADMIN_ROLE) return "outline";
  if (user.isRoot) return "secondary";
  return "default";
}

export function AccessManager({
  users,
  canManage,
  rootConfigured,
  currentUserId,
}: AccessManagerProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pendingUsers = useMemo(
    () => users.filter((user) => user.role === PENDING_ADMIN_ROLE),
    [users],
  );
  const adminUsers = useMemo(
    () =>
      users.filter((user) =>
        user.role
          .split(",")
          .map((role) => role.trim())
          .includes(ADMIN_ROLE),
      ),
    [users],
  );

  async function runAction(action: AdminAccessAction, userId: string) {
    setMessage(null);
    setBusyKey(`${action}:${userId}`);

    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(body?.error ?? "Não foi possível atualizar o acesso.");
        return;
      }

      setMessage("Acesso atualizado.");
      router.refresh();
    } catch {
      setMessage("Não foi possível atualizar o acesso.");
    } finally {
      setBusyKey(null);
    }
  }

  function userKey(user: AdminUserDTO, index: number): string {
    return `${user.id || "missing-id"}:${user.email}:${index}`;
  }

  function renderActions(user: AdminUserDTO) {
    const locked = !canManage || user.isRoot || user.id === currentUserId;
    const isBusy = (action: AdminAccessAction) => busyKey === `${action}:${user.id}`;

    if (user.role === PENDING_ADMIN_ROLE) {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            type="button"
            disabled={locked || isBusy("approve")}
            onClick={() => runAction("approve", user.id)}
          >
            <Check data-icon="inline-start" />
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={locked || isBusy("deny")}
            onClick={() => runAction("deny", user.id)}
          >
            <X data-icon="inline-start" />
            Recusar
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap justify-end gap-2">
        {user.banned ? (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={locked || isBusy("restore")}
            onClick={() => runAction("restore", user.id)}
          >
            <RotateCcw data-icon="inline-start" />
            Reativar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            disabled={locked || isBusy("suspend")}
            onClick={() => runAction("suspend", user.id)}
          >
            <Ban data-icon="inline-start" />
            Suspender
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          type="button"
          disabled={locked || isBusy("revoke")}
          onClick={() => runAction("revoke", user.id)}
        >
          <ShieldOff data-icon="inline-start" />
          Revogar
        </Button>
      </div>
    );
  }

  function renderTable(rows: AdminUserDTO[]) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conta
              </th>
              <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estado
              </th>
              <th className="hidden py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                Pedido
              </th>
              <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user, index) => (
              <tr
                key={userKey(user, index)}
                className="border-b border-border align-top last:border-0"
              >
                <td className="py-3 pr-4">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="break-all text-xs text-muted-foreground">{user.email}</div>
                  {user.banReason ? (
                    <div className="mt-1 text-xs text-muted-foreground">{user.banReason}</div>
                  ) : null}
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={roleVariant(user)}>{roleLabel(user)}</Badge>
                </td>
                <td className="hidden whitespace-nowrap py-3 pr-4 text-muted-foreground sm:table-cell">
                  {formatDate(user.createdAt)}
                </td>
                <td className="py-3">{renderActions(user)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!rootConfigured ? (
        <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>ROOT_USER_EMAIL não está configurado.</span>
        </p>
      ) : null}
      {rootConfigured && !canManage ? (
        <p className="flex items-start gap-2 border-l-2 border-foreground/20 pl-3 text-sm leading-6 text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>É necessário acesso de administrador principal.</span>
        </p>
      ) : null}
      {message ? (
        <p className="border-l-2 border-accent pl-3 text-sm leading-6 text-muted-foreground">
          {message}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Pedidos</h2>
          <span className="text-xs text-muted-foreground">{pendingUsers.length}</span>
        </div>
        {pendingUsers.length ? (
          renderTable(pendingUsers)
        ) : (
          <p className="border-y border-border py-4 text-sm text-muted-foreground">
            Sem pedidos pendentes. Os novos pedidos de administração aparecem aqui.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Administradores</h2>
          <span className="text-xs text-muted-foreground">{adminUsers.length}</span>
        </div>
        {adminUsers.length ? (
          renderTable(adminUsers)
        ) : (
          <p className="border-y border-border py-4 text-sm text-muted-foreground">
            Ainda não há administradores com acesso ao painel.
          </p>
        )}
      </section>
    </div>
  );
}
