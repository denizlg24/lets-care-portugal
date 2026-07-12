"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingCommentCount } from "@/hooks/use-admin-comments";
import { cn } from "@/lib/utils";

interface PendingCommentsBadgeProps {
  compact?: boolean;
  className?: string;
}

export function PendingCommentsBadge({ compact = true, className }: PendingCommentsBadgeProps) {
  const countQuery = usePendingCommentCount();

  if (countQuery.isPending) {
    return (
      <Skeleton
        aria-label="A carregar o número de comentários pendentes"
        className={cn("h-5 rounded-full", compact ? "w-7" : "w-24", className)}
      />
    );
  }

  if (countQuery.isError) {
    return (
      <Badge
        aria-label="Contagem de comentários pendentes indisponível"
        className={className}
        variant="outline"
      >
        {compact ? "—" : "Indisponível"}
      </Badge>
    );
  }

  const count = countQuery.data.pending;
  const formattedCount = count > 99 ? "99+" : String(count);

  return (
    <Badge
      aria-label={`${count} ${count === 1 ? "comentário pendente" : "comentários pendentes"}`}
      className={className}
      variant={count > 0 ? "destructive" : "outline"}
    >
      {compact ? formattedCount : `${formattedCount} ${count === 1 ? "pendente" : "pendentes"}`}
    </Badge>
  );
}
