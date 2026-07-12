"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestJson } from "@/lib/query/client";

export type AdminCommentStatus = "pending" | "approved" | "rejected";
export type CommentModerationAction = "approve" | "reject";
export type BulkCommentAction = CommentModerationAction | "delete";

export interface AdminComment {
  _id: string;
  blogId: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  status: AdminCommentStatus;
  moderatedBy?: string;
  moderatorName?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt?: string;
  blogTitle?: string;
  blogSlug?: string;
}

export interface AdminCommentStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface AdminCommentBlogOption {
  id: string;
  title: string;
  slug?: string;
}

export interface AdminCommentFilters {
  status?: AdminCommentStatus;
  blogId?: string;
  q?: string;
  limit?: number;
}

export interface AdminCommentsPage {
  comments: AdminComment[];
  nextCursor: string | null;
  hasMore: boolean;
  stats: AdminCommentStats;
  blogs: AdminCommentBlogOption[];
}

export interface ModerationLogEntry {
  _id: string;
  commentId: string;
  blogId: string;
  action: BulkCommentAction;
  fromStatus: AdminCommentStatus;
  toStatus?: AdminCommentStatus;
  moderatorName?: string;
  createdAt: string;
}

export interface CommentHistoryResponse {
  entries: ModerationLogEntry[];
}

export interface PendingCommentCountResponse {
  pending: number;
}

export interface ModerateCommentResponse {
  comment: AdminComment;
}

export interface DeleteCommentResponse {
  success: boolean;
  softDeleted: boolean;
}

export interface BulkCommentResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface BulkCommentsResponse {
  succeeded: number;
  failed: number;
  results: BulkCommentResult[];
}

const DEFAULT_PAGE_SIZE = 20;

export const adminCommentKeys = {
  all: ["admin-comments"] as const,
  lists: () => [...adminCommentKeys.all, "list"] as const,
  list: (filters: AdminCommentFilters) => [...adminCommentKeys.lists(), filters] as const,
  histories: () => [...adminCommentKeys.all, "history"] as const,
  history: (commentId: string) => [...adminCommentKeys.histories(), commentId] as const,
  pendingCount: () => [...adminCommentKeys.all, "pending-count"] as const,
};

function normalizedFilters(filters: AdminCommentFilters): AdminCommentFilters {
  return {
    status: filters.status,
    blogId: filters.blogId,
    q: filters.q?.trim() || undefined,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
  };
}

function commentsUrl(filters: AdminCommentFilters, cursor: string): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.blogId) params.set("blogId", filters.blogId);
  if (filters.q) params.set("q", filters.q);
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(filters.limit ?? DEFAULT_PAGE_SIZE));
  return `/api/admin/comments?${params.toString()}`;
}

async function invalidateModerationData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminCommentKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: adminCommentKeys.histories() }),
    queryClient.invalidateQueries({ queryKey: adminCommentKeys.pendingCount() }),
  ]);
}

export function useAdminComments(filters: AdminCommentFilters) {
  const normalized = normalizedFilters(filters);

  return useInfiniteQuery({
    queryKey: adminCommentKeys.list(normalized),
    queryFn: ({ pageParam, signal }) =>
      requestJson<AdminCommentsPage>(
        commentsUrl(normalized, pageParam),
        { signal },
        "Não foi possível carregar os comentários.",
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
  });
}

export function useCommentHistory(commentId: string, enabled = true) {
  return useQuery({
    queryKey: adminCommentKeys.history(commentId),
    queryFn: ({ signal }) =>
      requestJson<CommentHistoryResponse>(
        `/api/admin/comments/${commentId}/log`,
        { signal },
        "Não foi possível carregar o histórico.",
      ),
    enabled: enabled && Boolean(commentId),
  });
}

export function usePendingCommentCount() {
  return useQuery({
    queryKey: adminCommentKeys.pendingCount(),
    queryFn: ({ signal }) =>
      requestJson<PendingCommentCountResponse>(
        "/api/admin/comments/pending-count",
        { signal },
        "Não foi possível carregar a contagem pendente.",
      ),
  });
}

export function useModerateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: CommentModerationAction }) =>
      requestJson<ModerateCommentResponse>(
        `/api/admin/comments/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
        "Não foi possível moderar o comentário.",
      ),
    onSettled: () => invalidateModerationData(queryClient),
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      requestJson<DeleteCommentResponse>(
        `/api/admin/comments/${id}`,
        { method: "DELETE" },
        "Não foi possível eliminar o comentário.",
      ),
    onSettled: () => invalidateModerationData(queryClient),
  });
}

export function useBulkCommentAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: BulkCommentAction }) =>
      requestJson<BulkCommentsResponse>(
        "/api/admin/comments/bulk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action }),
        },
        "Não foi possível moderar os comentários selecionados.",
      ),
    onSettled: () => invalidateModerationData(queryClient),
  });
}
