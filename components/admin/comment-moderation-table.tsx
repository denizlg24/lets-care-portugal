"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Check,
  LoaderCircle,
  Maximize2,
  MessageSquareText,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CommentHistoryPopover } from "@/components/admin/comment-history-popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AdminComment,
  type AdminCommentStatus,
  type BulkCommentAction,
  useAdminComments,
  useBulkCommentAction,
  useDeleteComment,
  useModerateComment,
} from "@/hooks/use-admin-comments";
import { formatBlogDateTime, formatBlogRelativeTime } from "@/lib/blog/format";
import { getRequestErrorMessage } from "@/lib/query/client";

type StatusFilter = AdminCommentStatus | "all";

type ConfirmationState =
  | { kind: "delete"; comment: AdminComment }
  | {
      kind: "bulk";
      action: BulkCommentAction;
      ids: string[];
      skipped: number;
    };

const statusLabels: Record<AdminCommentStatus, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

const bulkLabels: Record<BulkCommentAction, string> = {
  approve: "aprovar",
  reject: "rejeitar",
  delete: "eliminar",
};

function StatusBadge({ status }: { status: AdminCommentStatus }) {
  const className = {
    pending:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    approved:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    rejected:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  }[status];

  return (
    <Badge className={className} variant="outline">
      {statusLabels[status]}
    </Badge>
  );
}

interface CommentActionsProps {
  comment: AdminComment;
  busy: boolean;
  labels?: boolean;
  onDelete: (comment: AdminComment) => void;
  onModerate: (comment: AdminComment, action: "approve" | "reject") => void;
}

function CommentActions({
  comment,
  busy,
  labels = false,
  onDelete,
  onModerate,
}: CommentActionsProps) {
  const size = labels ? "sm" : "icon-sm";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {comment.status !== "approved" ? (
        <Button
          aria-label={`Aprovar comentário de ${comment.authorName}`}
          disabled={busy}
          onClick={() => onModerate(comment, "approve")}
          size={size}
          title="Aprovar"
          type="button"
          variant="ghost"
        >
          <Check />
          {labels ? "Aprovar" : null}
        </Button>
      ) : null}
      {comment.status !== "rejected" ? (
        <Button
          aria-label={`Rejeitar comentário de ${comment.authorName}`}
          disabled={busy}
          onClick={() => onModerate(comment, "reject")}
          size={size}
          title="Rejeitar"
          type="button"
          variant="ghost"
        >
          <X />
          {labels ? "Rejeitar" : null}
        </Button>
      ) : null}
      <Button
        aria-label={`Eliminar comentário de ${comment.authorName}`}
        disabled={busy}
        onClick={() => onDelete(comment)}
        size={size}
        title="Eliminar"
        type="button"
        variant="destructive"
      >
        <Trash2 />
        {labels ? "Eliminar" : null}
      </Button>
    </div>
  );
}

interface CommentPreviewButtonProps {
  comment: AdminComment;
  mobile?: boolean;
  onOpen: (comment: AdminComment, trigger: HTMLButtonElement) => void;
}

function CommentPreviewButton({ comment, mobile = false, onOpen }: CommentPreviewButtonProps) {
  return (
    <button
      aria-haspopup="dialog"
      aria-label={`Ver comentário completo de ${comment.authorName}`}
      className={`group -m-1 block w-[calc(100%+0.5rem)] rounded-md p-1 text-left whitespace-normal outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 ${mobile ? "" : "max-w-md"}`}
      onClick={(event) => onOpen(comment, event.currentTarget)}
      title="Ver comentário completo"
      type="button"
    >
      {comment.parentId ? (
        <Badge className="mb-1" variant="outline">
          ↳ Resposta
        </Badge>
      ) : null}
      <span
        className={
          mobile
            ? "line-clamp-4 whitespace-pre-wrap break-words text-sm leading-5 [overflow-wrap:anywhere]"
            : "line-clamp-3 text-sm leading-5 [overflow-wrap:anywhere]"
        }
      >
        {comment.content}
      </span>
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
        <Maximize2 aria-hidden="true" className="size-3" />
        Ver comentário completo
      </span>
    </button>
  );
}

interface CommentDetailDialogProps {
  busy: boolean;
  comment: AdminComment | null;
  finalFocus: () => HTMLElement | null;
  onDelete: (comment: AdminComment) => void;
  onModerate: (comment: AdminComment, action: "approve" | "reject") => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
}

function CommentDetailDialog({
  busy,
  comment,
  finalFocus,
  onDelete,
  onModerate,
  onOpenChange,
}: CommentDetailDialogProps) {
  async function handleModeration(action: "approve" | "reject") {
    if (!comment) return;
    const succeeded = await onModerate(comment, action);
    if (succeeded) onOpenChange(false);
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open || !busy) onOpenChange(open);
      }}
      open={Boolean(comment)}
    >
      {comment ? (
        <DialogContent
          aria-busy={busy}
          className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl"
          finalFocus={finalFocus}
          showCloseButton={!busy}
        >
          <DialogHeader>
            <DialogTitle>Moderar comentário</DialogTitle>
            <DialogDescription>
              Leia o comentário completo de {comment.authorName} antes de escolher uma ação.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={comment.status} />
              {comment.parentId ? <Badge variant="outline">↳ Resposta</Badge> : null}
            </div>

            <dl className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Autor
                </dt>
                <dd className="mt-1 font-medium text-foreground">{comment.authorName}</dd>
                {comment.authorEmail ? (
                  <dd className="break-all text-xs text-muted-foreground">{comment.authorEmail}</dd>
                ) : null}
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Artigo
                </dt>
                <dd className="mt-1">
                  {comment.blogSlug ? (
                    <Link
                      className="font-medium text-foreground underline-offset-4 hover:underline"
                      href={`/blog/${comment.blogSlug}`}
                    >
                      {comment.blogTitle || "Ver artigo"}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">
                      {comment.blogTitle || "Artigo indisponível"}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Submetido
                </dt>
                <dd className="mt-1">
                  <time dateTime={comment.createdAt}>{formatBlogDateTime(comment.createdAt)}</time>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Última moderação
                </dt>
                <dd className="mt-1">
                  {comment.moderatedAt ? (
                    <>
                      <span>{comment.moderatorName?.trim() || "Administrador"}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatBlogDateTime(comment.moderatedAt)}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Sem moderação</span>
                  )}
                </dd>
              </div>
            </dl>

            <section aria-labelledby={`comment-detail-content-${comment._id}`}>
              <h3
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                id={`comment-detail-content-${comment._id}`}
              >
                Comentário completo
              </h3>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-4 text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
                {comment.content}
              </p>
            </section>
          </div>

          <DialogFooter className="sm:items-center sm:justify-between">
            <DialogClose
              disabled={busy}
              render={<Button disabled={busy} type="button" variant="outline" />}
            >
              Fechar
            </DialogClose>
            <CommentActions
              busy={busy}
              comment={comment}
              labels
              onDelete={onDelete}
              onModerate={(_comment, action) => void handleModeration(action)}
            />
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function ModerationTableSkeleton() {
  return (
    <div aria-label="A carregar comentários" className="space-y-4" role="status">
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-8 sm:col-span-1" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
      <div className="rounded-xl border border-border">
        {["one", "two", "three", "four", "five"].map((key) => (
          <div className="flex items-center gap-4 border-b p-4 last:border-0" key={key}>
            <Skeleton className="size-4 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="hidden h-5 w-20 sm:block" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function columnClass(columnId: string): string | undefined {
  if (columnId === "select") return "w-10";
  if (columnId === "blog") return "hidden lg:table-cell";
  if (columnId === "submitted") return "hidden xl:table-cell";
  if (columnId === "moderation") return "hidden 2xl:table-cell";
  if (columnId === "actions") return "text-right";
  return undefined;
}

export function CommentModerationTable() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [blogId, setBlogId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [detailComment, setDetailComment] = useState<AdminComment | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      blogId: blogId === "all" ? undefined : blogId,
      q: searchQuery || undefined,
    }),
    [blogId, searchQuery, status],
  );
  const commentsQuery = useAdminComments(filters);
  const moderateMutation = useModerateComment();
  const deleteMutation = useDeleteComment();
  const bulkMutation = useBulkCommentAction();

  const comments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [],
    [commentsQuery.data],
  );
  const firstPage = commentsQuery.data?.pages[0];
  const selectedComments = useMemo(
    () => comments.filter((comment) => rowSelection[comment._id]),
    [comments, rowSelection],
  );
  const actionsBusy =
    moderateMutation.isPending || deleteMutation.isPending || bulkMutation.isPending;

  const runModeration = useCallback(
    async (comment: AdminComment, action: "approve" | "reject") => {
      try {
        await moderateMutation.mutateAsync({ id: comment._id, action });
        toast.success(action === "approve" ? "Comentário aprovado." : "Comentário rejeitado.");
        return true;
      } catch (error) {
        toast.error(getRequestErrorMessage(error, "Não foi possível moderar o comentário."));
        return false;
      }
    },
    [moderateMutation],
  );

  const requestDelete = useCallback((comment: AdminComment) => {
    setConfirmation({ kind: "delete", comment });
  }, []);

  const openCommentDetail = useCallback((comment: AdminComment, trigger: HTMLButtonElement) => {
    detailTriggerRef.current = trigger;
    setDetailComment(comment);
  }, []);

  const restoreDetailFocus = useCallback(() => {
    const trigger = detailTriggerRef.current;
    return trigger?.isConnected ? trigger : searchInputRef.current;
  }, []);

  const columns = useMemo<ColumnDef<AdminComment>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Selecionar todos os comentários carregados"
            checked={table.getIsAllRowsSelected()}
            disabled={actionsBusy || table.getRowModel().rows.length === 0}
            indeterminate={table.getIsSomeRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllRowsSelected(checked)}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Selecionar comentário de ${row.original.authorName}`}
            checked={row.getIsSelected()}
            disabled={actionsBusy}
            onCheckedChange={(checked) => row.toggleSelected(checked)}
          />
        ),
      },
      {
        id: "author",
        header: "Autor",
        cell: ({ row }) => (
          <div className="min-w-32 whitespace-normal">
            <p className="font-medium text-foreground">{row.original.authorName}</p>
            {row.original.authorEmail ? (
              <p className="break-all text-xs text-muted-foreground">{row.original.authorEmail}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "comment",
        header: "Comentário",
        cell: ({ row }) => (
          <CommentPreviewButton comment={row.original} onOpen={openCommentDetail} />
        ),
      },
      {
        id: "blog",
        header: "Artigo",
        cell: ({ row }) =>
          row.original.blogSlug ? (
            <Link
              className="block max-w-40 truncate text-sm underline-offset-4 hover:underline"
              href={`/blog/${row.original.blogSlug}`}
              title={row.original.blogTitle}
            >
              {row.original.blogTitle || "Ver artigo"}
            </Link>
          ) : (
            <span className="block max-w-40 truncate text-muted-foreground">
              {row.original.blogTitle || "Artigo indisponível"}
            </span>
          ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "submitted",
        header: "Enviado",
        cell: ({ row }) => (
          <time
            className="text-xs text-muted-foreground"
            dateTime={row.original.createdAt}
            title={formatBlogDateTime(row.original.createdAt)}
          >
            {formatBlogRelativeTime(row.original.createdAt)}
          </time>
        ),
      },
      {
        id: "moderation",
        header: "Moderação",
        cell: ({ row }) => (
          <div className="min-w-32">
            {row.original.moderatedAt ? (
              <>
                <p className="truncate text-xs">
                  {row.original.moderatorName?.trim() || "Administrador"}
                </p>
                <time className="text-xs text-muted-foreground" dateTime={row.original.moderatedAt}>
                  {formatBlogDateTime(row.original.moderatedAt)}
                </time>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sem moderação</p>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <CommentHistoryPopover
              authorName={row.original.authorName}
              commentId={row.original._id}
              disabled={actionsBusy}
            />
            <CommentActions
              busy={actionsBusy}
              comment={row.original}
              onDelete={requestDelete}
              onModerate={(comment, action) => void runModeration(comment, action)}
            />
          </div>
        ),
      },
    ],
    [actionsBusy, openCommentDetail, requestDelete, runModeration],
  );

  const table = useReactTable({
    data: comments,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
    enableRowSelection: !actionsBusy,
  });

  function clearFilters() {
    setStatus("all");
    setBlogId("all");
    setSearchInput("");
    setSearchQuery("");
    setRowSelection({});
  }

  function updateSelectionForFilters() {
    setRowSelection({});
  }

  function requestBulkAction(action: BulkCommentAction) {
    const eligible = selectedComments.filter((comment) => {
      if (action === "approve") return comment.status !== "approved";
      if (action === "reject") return comment.status !== "rejected";
      return true;
    });

    if (eligible.length === 0) return;
    setConfirmation({
      kind: "bulk",
      action,
      ids: eligible.map((comment) => comment._id),
      skipped: selectedComments.length - eligible.length,
    });
  }

  function removeSelectedIds(ids: string[]) {
    setRowSelection((current) => {
      const next = { ...current };
      for (const id of ids) delete next[id];
      return next;
    });
  }

  async function confirmAction() {
    if (!confirmation) return;

    if (confirmation.kind === "delete") {
      const commentId = confirmation.comment._id;
      try {
        const result = await deleteMutation.mutateAsync(commentId);
        removeSelectedIds([commentId]);
        setDetailComment((current) => (current?._id === commentId ? null : current));
        setConfirmation(null);
        toast.success(
          result.softDeleted
            ? "Comentário ocultado; as respostas foram preservadas."
            : "Comentário eliminado.",
        );
      } catch (error) {
        toast.error(getRequestErrorMessage(error, "Não foi possível eliminar o comentário."));
      }
      return;
    }

    try {
      const result = await bulkMutation.mutateAsync({
        ids: confirmation.ids,
        action: confirmation.action,
      });
      const successfulIds = result.results.filter((item) => item.success).map((item) => item.id);
      const failureReasons = result.results
        .filter((item) => !item.success && item.error)
        .map((item) => item.error)
        .slice(0, 2)
        .join(" ");
      removeSelectedIds(successfulIds);
      setConfirmation(null);

      if (result.failed === 0) {
        toast.success(
          `${result.succeeded} ${result.succeeded === 1 ? "comentário atualizado" : "comentários atualizados"}.`,
        );
      } else if (result.succeeded > 0) {
        toast.warning(
          `${result.succeeded} concluídos; ${result.failed} falharam.`,
          failureReasons ? { description: failureReasons } : undefined,
        );
      } else {
        toast.error(
          `Não foi possível atualizar ${result.failed} ${result.failed === 1 ? "comentário" : "comentários"}.`,
          failureReasons ? { description: failureReasons } : undefined,
        );
      }
    } catch (error) {
      toast.error(
        getRequestErrorMessage(error, "Não foi possível atualizar os comentários selecionados."),
      );
    }
  }

  if (commentsQuery.isPending) return <ModerationTableSkeleton />;

  if (commentsQuery.isError && !commentsQuery.data) {
    return (
      <Empty className="border" role="alert">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageSquareText />
          </EmptyMedia>
          <EmptyTitle>Não foi possível carregar os comentários</EmptyTitle>
          <EmptyDescription>
            {getRequestErrorMessage(commentsQuery.error, "Tente novamente dentro de momentos.")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            disabled={commentsQuery.isFetching}
            onClick={() => void commentsQuery.refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className={commentsQuery.isFetching ? "animate-spin" : undefined} />
            Tentar novamente
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const stats = firstPage?.stats;
  const approveCount = selectedComments.filter((comment) => comment.status !== "approved").length;
  const rejectCount = selectedComments.filter((comment) => comment.status !== "rejected").length;
  const filterActive = status !== "all" || blogId !== "all" || Boolean(searchInput);
  const confirmationBusy = deleteMutation.isPending || bulkMutation.isPending;
  const destructiveConfirmation =
    confirmation?.kind === "delete" ||
    (confirmation?.kind === "bulk" && confirmation.action === "delete");
  const confirmationTitle =
    confirmation?.kind === "delete"
      ? "Eliminar este comentário?"
      : confirmation?.kind === "bulk"
        ? `${bulkLabels[confirmation.action][0].toUpperCase()}${bulkLabels[confirmation.action].slice(1)} comentários?`
        : "Confirmar ação";
  const confirmationDescription =
    confirmation?.kind === "delete"
      ? "A eliminação é permanente quando não existem respostas. Se existirem respostas, o comentário será ocultado para preservar a conversa."
      : confirmation?.kind === "bulk"
        ? `Esta ação será aplicada a ${confirmation.ids.length} ${confirmation.ids.length === 1 ? "comentário elegível" : "comentários elegíveis"}.${confirmation.skipped ? ` ${confirmation.skipped} selecionados não são elegíveis e serão ignorados.` : ""}${confirmation.action === "delete" ? " Comentários com respostas serão ocultados para preservar a conversa." : ""}`
        : "Reveja a ação antes de continuar.";

  return (
    <div aria-busy={commentsQuery.isFetching || actionsBusy} className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_auto_auto_auto] lg:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="comment-search">
            Pesquisar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-8 pr-8"
              id="comment-search"
              onChange={(event) => {
                setSearchInput(event.target.value);
                updateSelectionForFilters();
              }}
              placeholder="Autor, comentário ou artigo…"
              ref={searchInputRef}
              type="search"
              value={searchInput}
            />
            {searchInput ? (
              <Button
                aria-label="Limpar pesquisa"
                className="absolute right-0.5 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  updateSelectionForFilters();
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="comment-status">
            Estado
          </label>
          <NativeSelect
            className="w-full lg:w-44"
            id="comment-status"
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              updateSelectionForFilters();
            }}
            value={status}
          >
            <NativeSelectOption value="all">
              Todos{stats ? ` (${stats.total})` : ""}
            </NativeSelectOption>
            <NativeSelectOption value="pending">
              Pendentes{stats ? ` (${stats.pending})` : ""}
            </NativeSelectOption>
            <NativeSelectOption value="approved">
              Aprovados{stats ? ` (${stats.approved})` : ""}
            </NativeSelectOption>
            <NativeSelectOption value="rejected">
              Rejeitados{stats ? ` (${stats.rejected})` : ""}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="comment-blog">
            Artigo
          </label>
          <NativeSelect
            className="w-full lg:w-52"
            id="comment-blog"
            onChange={(event) => {
              setBlogId(event.target.value);
              updateSelectionForFilters();
            }}
            value={blogId}
          >
            <NativeSelectOption value="all">Todos os artigos</NativeSelectOption>
            {firstPage?.blogs.map((blog) => (
              <NativeSelectOption key={blog.id} value={blog.id}>
                {blog.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <Button disabled={!filterActive} onClick={clearFilters} type="button" variant="outline">
          Limpar filtros
        </Button>
      </div>

      <div aria-live="polite" className="min-h-5 text-xs text-muted-foreground">
        {commentsQuery.isFetching && !commentsQuery.isFetchingNextPage ? (
          <span className="inline-flex items-center gap-1.5">
            <LoaderCircle className="size-3.5 animate-spin" /> A atualizar resultados…
          </span>
        ) : (
          `${comments.length} ${comments.length === 1 ? "comentário carregado" : "comentários carregados"}`
        )}
      </div>

      {selectedComments.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center">
          <p aria-live="polite" className="min-w-0 flex-1 text-sm font-medium">
            {selectedComments.length}{" "}
            {selectedComments.length === 1 ? "selecionado" : "selecionados"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={actionsBusy || approveCount === 0}
              onClick={() => requestBulkAction("approve")}
              size="sm"
              type="button"
              variant="outline"
            >
              <Check /> Aprovar ({approveCount})
            </Button>
            <Button
              disabled={actionsBusy || rejectCount === 0}
              onClick={() => requestBulkAction("reject")}
              size="sm"
              type="button"
              variant="outline"
            >
              <X /> Rejeitar ({rejectCount})
            </Button>
            <Button
              disabled={actionsBusy}
              onClick={() => requestBulkAction("delete")}
              size="sm"
              type="button"
              variant="destructive"
            >
              <Trash2 /> Eliminar ({selectedComments.length})
            </Button>
            <Button
              disabled={actionsBusy}
              onClick={() => setRowSelection({})}
              size="sm"
              type="button"
              variant="ghost"
            >
              Limpar seleção
            </Button>
          </div>
        </div>
      ) : null}

      {comments.length === 0 ? (
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareText />
            </EmptyMedia>
            <EmptyTitle>
              {status === "pending" && blogId === "all" && !searchQuery
                ? "Sem comentários pendentes"
                : "Nenhum comentário encontrado"}
            </EmptyTitle>
            <EmptyDescription>
              {status === "pending" && blogId === "all" && !searchQuery
                ? "A fila de moderação está atualizada."
                : "Altere ou limpe os filtros para procurar noutros comentários."}
            </EmptyDescription>
          </EmptyHeader>
          {filterActive ? (
            <EmptyContent>
              <Button onClick={clearFilters} type="button" variant="outline">
                Limpar filtros
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <>
          <div className="hidden rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead className={columnClass(header.column.id)} key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow data-state={row.getIsSelected() ? "selected" : undefined} key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className={columnClass(cell.column.id)} key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {table.getRowModel().rows.map((row) => {
              const comment = row.original;
              return (
                <article className="space-y-3 rounded-xl border border-border p-4" key={row.id}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      aria-label={`Selecionar comentário de ${comment.authorName}`}
                      checked={row.getIsSelected()}
                      disabled={actionsBusy}
                      onCheckedChange={(checked) => row.toggleSelected(checked)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{comment.authorName}</p>
                      {comment.authorEmail ? (
                        <p className="break-all text-xs text-muted-foreground">
                          {comment.authorEmail}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={comment.status} />
                  </div>
                  <CommentPreviewButton comment={comment} mobile onOpen={openCommentDetail} />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {comment.blogSlug ? (
                      <Link
                        className="max-w-full truncate underline-offset-4 hover:underline"
                        href={`/blog/${comment.blogSlug}`}
                      >
                        {comment.blogTitle || "Ver artigo"}
                      </Link>
                    ) : null}
                    <time
                      dateTime={comment.createdAt}
                      title={formatBlogDateTime(comment.createdAt)}
                    >
                      {formatBlogRelativeTime(comment.createdAt)}
                    </time>
                    <CommentHistoryPopover
                      authorName={comment.authorName}
                      commentId={comment._id}
                      disabled={actionsBusy}
                    />
                  </div>
                  <CommentActions
                    busy={actionsBusy}
                    comment={comment}
                    labels
                    onDelete={requestDelete}
                    onModerate={(item, action) => void runModeration(item, action)}
                  />
                </article>
              );
            })}
          </div>
        </>
      )}

      {comments.length > 0 ? (
        <div className="flex flex-col items-center gap-2 border-t border-border pt-4">
          {commentsQuery.isFetchNextPageError ? (
            <div className="text-center" role="alert">
              <p className="text-sm text-destructive">
                Não foi possível carregar mais comentários.
              </p>
              <Button
                className="mt-2"
                onClick={() => void commentsQuery.fetchNextPage()}
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCw /> Tentar novamente
              </Button>
            </div>
          ) : commentsQuery.hasNextPage ? (
            <Button
              disabled={commentsQuery.isFetchingNextPage}
              onClick={() => void commentsQuery.fetchNextPage()}
              type="button"
              variant="outline"
            >
              {commentsQuery.isFetchingNextPage ? <LoaderCircle className="animate-spin" /> : null}
              {commentsQuery.isFetchingNextPage ? "A carregar…" : "Carregar mais"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Todos os comentários disponíveis foram carregados.
            </p>
          )}
        </div>
      ) : null}

      <CommentDetailDialog
        busy={actionsBusy}
        comment={detailComment}
        finalFocus={restoreDetailFocus}
        onDelete={requestDelete}
        onModerate={runModeration}
        onOpenChange={(open) => {
          if (!open) setDetailComment(null);
        }}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open && !confirmationBusy) setConfirmation(null);
        }}
        open={Boolean(confirmation)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              {destructiveConfirmation ? (
                <Trash2 />
              ) : confirmation?.kind === "bulk" && confirmation.action === "approve" ? (
                <Check />
              ) : (
                <X />
              )}
            </AlertDialogMedia>
            <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmationDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmationBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmationBusy}
              onClick={() => void confirmAction()}
              variant={destructiveConfirmation ? "destructive" : "default"}
            >
              {confirmationBusy ? <LoaderCircle className="animate-spin" /> : null}
              {confirmationBusy ? "A processar…" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
