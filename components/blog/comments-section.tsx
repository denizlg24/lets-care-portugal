"use client";

import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Loader2, MessageCircle, Pencil } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAnonIdentity, setAnonName } from "@/lib/blog/anon";
import { initials } from "@/lib/blog/format";
import { cn } from "@/lib/utils";

interface Comment {
  _id: string;
  blogId: string;
  parentId?: string;
  authorName: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  sessionId?: string;
  createdAt: string;
}

interface Thread {
  comment: Comment;
  replies: Comment[];
}

interface CommentsSectionProps {
  blogId: string;
}

function relativeTime(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: pt });
}

export function CommentsSection({ blogId }: CommentsSectionProps) {
  const [threads, setThreads] = React.useState<Thread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [name, setName] = React.useState("");
  const [sessionId, setSessionId] = React.useState("");

  React.useEffect(() => {
    const identity = getAnonIdentity();
    setName(identity.name);
    setSessionId(identity.sessionId);

    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/blog/comments?blogId=${blogId}&sessionId=${identity.sessionId}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        const top: Comment[] = data.comments ?? [];

        const withReplies = await Promise.all(
          top.map(async (comment) => {
            const r = await fetch(
              `/api/blog/comments?blogId=${blogId}&parentId=${comment._id}&sessionId=${identity.sessionId}`,
              { cache: "no-store" },
            );
            const rd = await r.json();
            return { comment, replies: (rd.comments ?? []) as Comment[] };
          }),
        );

        if (!cancelled) setThreads(withReplies);
      } catch {
        // Leave the section empty on failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [blogId]);

  const total = threads.reduce((sum, thread) => sum + 1 + thread.replies.length, 0);

  function handleNameChange(next: string) {
    setName(next);
    setAnonName(next);
  }

  async function submit(content: string, parentId?: string): Promise<boolean> {
    const res = await fetch("/api/blog/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blogId,
        parentId,
        authorName: name.trim() || "Anónimo",
        content: content.trim(),
        sessionId,
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const comment: Comment = data.comment;

    setThreads((prev) => {
      if (parentId) {
        return prev.map((thread) =>
          thread.comment._id === parentId
            ? { ...thread, replies: [...thread.replies, comment] }
            : thread,
        );
      }
      return [{ comment, replies: [] }, ...prev];
    });
    return true;
  }

  return (
    <section aria-labelledby="comments-heading" className="mt-16">
      <h2
        id="comments-heading"
        className="flex items-center gap-2 font-heading text-xl font-bold text-foreground"
      >
        <MessageCircle className="size-5 text-muted-foreground" aria-hidden />
        Comentários
        {!loading && total > 0 && (
          <span className="text-base font-normal text-muted-foreground">({total})</span>
        )}
      </h2>

      <div className="mt-6 rounded-xl bg-muted/40 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Pencil className="size-3.5" aria-hidden />
          <span>A comentar como</span>
          <Input
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            maxLength={100}
            aria-label="O seu nome"
            className="h-7 w-44 bg-background"
          />
        </div>
        <CommentForm
          placeholder="Escreva um comentário…"
          submitLabel="Comentar"
          onSubmit={(content) => submit(content)}
        />
      </div>

      {loading ? (
        <div className="mt-8 flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </div>
      ) : threads.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">
          Ainda não há comentários. Seja o primeiro a partilhar a sua opinião.
        </p>
      ) : (
        <ul className="mt-8 space-y-8">
          {threads.map((thread) => (
            <li key={thread.comment._id}>
              <CommentItem
                comment={thread.comment}
                ownSessionId={sessionId}
                onReply={(content) => submit(content, thread.comment._id)}
              />
              {thread.replies.length > 0 && (
                <ul className="mt-6 space-y-6 border-l border-border pl-5 sm:pl-6">
                  {thread.replies.map((reply) => (
                    <li key={reply._id}>
                      <CommentItem comment={reply} ownSessionId={sessionId} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface CommentItemProps {
  comment: Comment;
  ownSessionId: string;
  onReply?: (content: string) => Promise<boolean>;
}

function CommentItem({ comment, ownSessionId, onReply }: CommentItemProps) {
  const [replying, setReplying] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);
  const contentRef = React.useRef<HTMLParagraphElement>(null);
  const isOwn = !!comment.sessionId && comment.sessionId === ownSessionId;
  const pending = comment.status !== "approved";
  const contentId = `comment-content-${comment._id}`;

  React.useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    function measureOverflow() {
      const target = contentRef.current;
      if (!target) return;

      const lineHeight = Number.parseFloat(window.getComputedStyle(target).lineHeight);
      if (!Number.isFinite(lineHeight)) return;
      setCanExpand(target.scrollHeight > lineHeight * 3 + 1);
    }

    measureOverflow();
    const observer = new ResizeObserver(measureOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex gap-3">
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback className="bg-secondary/15 text-[0.65rem] font-semibold text-secondary-foreground">
          {initials(comment.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold text-foreground">{comment.authorName}</span>
          <span className="text-muted-foreground">·</span>
          <time dateTime={comment.createdAt} className="text-muted-foreground">
            {relativeTime(comment.createdAt)}
          </time>
          {pending && isOwn && (
            <Badge variant="outline" className="text-muted-foreground">
              Aguarda aprovação
            </Badge>
          )}
        </div>
        <p
          id={contentId}
          ref={contentRef}
          className={cn(
            "mt-1 whitespace-pre-wrap break-words text-pretty leading-relaxed text-foreground [overflow-wrap:anywhere]",
            !expanded && "line-clamp-3",
            pending && "text-muted-foreground",
          )}
        >
          {comment.content}
        </p>
        {canExpand ? (
          <button
            aria-controls={contentId}
            aria-expanded={expanded}
            className="mt-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => setExpanded((current) => !current)}
            type="button"
          >
            {expanded ? "Ver menos" : "Ver mais"}
          </button>
        ) : null}
        {onReply && (
          <div className="mt-2">
            {replying ? (
              <CommentForm
                placeholder={`Responder a ${comment.authorName}…`}
                submitLabel="Responder"
                autoFocus
                onCancel={() => setReplying(false)}
                onSubmit={async (content) => {
                  const ok = await onReply(content);
                  if (ok) setReplying(false);
                  return ok;
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setReplying(true)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Responder
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentFormProps {
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<boolean>;
}

function CommentForm({
  placeholder,
  submitLabel,
  autoFocus,
  onCancel,
  onSubmit,
}: CommentFormProps) {
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (content.trim().length < 2 || submitting) return;
    setSubmitting(true);
    setNotice(null);
    const ok = await onSubmit(content);
    setSubmitting(false);
    if (ok) {
      setContent("");
      setNotice("Comentário enviado — ficará visível após aprovação.");
    } else {
      setNotice("Não foi possível enviar. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        autoFocus={autoFocus}
        className="resize-y bg-background"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={content.trim().length < 2 || submitting}>
          {submitting && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        {notice && <span className="text-xs text-muted-foreground">{notice}</span>}
      </div>
    </form>
  );
}
