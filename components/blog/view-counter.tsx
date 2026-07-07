"use client";

import { Eye } from "lucide-react";
import * as React from "react";
import { formatViews } from "@/lib/blog/format";

interface ViewCounterProps {
  blogId: string;
  initialViews: number;
}

/**
 * Displays the live view count and registers one view per browser session.
 * The page itself stays statically rendered — the increment happens here on
 * the client, guarded by sessionStorage so a reload doesn't inflate the count.
 */
export function ViewCounter({ blogId, initialViews }: ViewCounterProps) {
  const [views, setViews] = React.useState(initialViews);

  React.useEffect(() => {
    let cancelled = false;
    const guardKey = `lc_viewed_${blogId}`;
    const alreadyViewed = window.sessionStorage.getItem(guardKey) === "1";

    async function run() {
      try {
        if (alreadyViewed) {
          const res = await fetch(`/api/blog/views?blogId=${blogId}`, {
            cache: "no-store",
          });
          if (!res.ok) return;
          const data = await res.json();
          if (!cancelled && typeof data.views === "number") setViews(data.views);
          return;
        }

        const res = await fetch("/api/blog/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blogId }),
        });
        if (!res.ok) return;
        const data = await res.json();
        window.sessionStorage.setItem(guardKey, "1");
        if (!cancelled && typeof data.views === "number") setViews(data.views);
      } catch {
        // Views are non-critical; fail quietly and keep the SSR value.
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [blogId]);

  return (
    <span className="inline-flex items-center gap-1.5" title={`${views} visualizações`}>
      <Eye className="size-4" aria-hidden />
      <span>
        {formatViews(views)} {views === 1 ? "visualização" : "visualizações"}
      </span>
    </span>
  );
}
