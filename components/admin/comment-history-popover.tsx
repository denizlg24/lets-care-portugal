"use client";

import { CheckCircle2, History, RefreshCw, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminCommentStatus,
  type BulkCommentAction,
  useCommentHistory,
} from "@/hooks/use-admin-comments";
import { formatBlogDateTime } from "@/lib/blog/format";
import { getRequestErrorMessage } from "@/lib/query/client";

interface CommentHistoryPopoverProps {
  commentId: string;
  authorName: string;
  disabled?: boolean;
}

const statusLabels: Record<AdminCommentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const actionMeta = {
  approve: { label: "Aprovação", icon: CheckCircle2 },
  reject: { label: "Rejeição", icon: XCircle },
  delete: { label: "Eliminação", icon: Trash2 },
} satisfies Record<BulkCommentAction, { label: string; icon: typeof History }>;

function HistorySkeleton() {
  return (
    <div aria-label="A carregar o histórico" className="space-y-4" role="status">
      {["first", "second", "third"].map((key) => (
        <div className="flex gap-3" key={key}>
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CommentHistoryPopover({
  commentId,
  authorName,
  disabled = false,
}: CommentHistoryPopoverProps) {
  const [open, setOpen] = useState(false);
  const historyQuery = useCommentHistory(commentId, open);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            aria-label={`Ver histórico de moderação do comentário de ${authorName}`}
            disabled={disabled}
            size="icon-sm"
            title="Ver histórico"
            type="button"
            variant="ghost"
          />
        }
      >
        <History />
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de moderação</DialogTitle>
          <DialogDescription>
            Ações registadas no comentário de {authorName}, da mais recente para a mais antiga.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,30rem)] overflow-y-auto pr-1">
          {historyQuery.isPending ? <HistorySkeleton /> : null}

          {historyQuery.isError ? (
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              role="alert"
            >
              <p className="text-sm text-destructive">
                {getRequestErrorMessage(
                  historyQuery.error,
                  "Não foi possível carregar o histórico.",
                )}
              </p>
              <Button
                className="mt-3"
                disabled={historyQuery.isFetching}
                onClick={() => void historyQuery.refetch()}
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCw className={historyQuery.isFetching ? "animate-spin" : undefined} />
                Tentar novamente
              </Button>
            </div>
          ) : null}

          {historyQuery.isSuccess && historyQuery.data.entries.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Ainda não existem ações de moderação registadas.
            </p>
          ) : null}

          {historyQuery.isSuccess && historyQuery.data.entries.length > 0 ? (
            <ol className="space-y-1">
              {historyQuery.data.entries.map((entry) => {
                const meta = actionMeta[entry.action];
                const Icon = meta.icon;
                const resultingStatus = entry.toStatus ? statusLabels[entry.toStatus] : "Eliminado";

                return (
                  <li className="flex gap-3 rounded-lg p-2.5 hover:bg-muted/50" key={entry._id}>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{meta.label}</span>
                        <Badge variant="outline">
                          {statusLabels[entry.fromStatus]} → {resultingStatus}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Por {entry.moderatorName?.trim() || "Administrador"}
                      </p>
                      <time className="text-xs text-muted-foreground" dateTime={entry.createdAt}>
                        {formatBlogDateTime(entry.createdAt)}
                      </time>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
