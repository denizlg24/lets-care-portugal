"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AboutNavItem {
  id: string;
  label: string;
}

interface AboutSectionNavProps {
  items: AboutNavItem[];
}

/**
 * Scroll-reactive index of the about page sections: a horizontal bar stuck
 * under the site header on small screens, a vertical rail beside the content
 * on large ones. The active entry follows an IntersectionObserver band near
 * the top of the viewport; clicking an entry smooth-scrolls to the section.
 */
export function AboutSectionNav({ items }: AboutSectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = items.find((item) => visible.has(item.id));
        if (first) setActiveId(first.id);
      },
      // Band below the sticky header/bar; a section is "active" while it
      // crosses the upper half of the viewport.
      { rootMargin: "-120px 0px -50% 0px" },
    );

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!activeId) return;
    // Keep the active pill in view when the horizontal bar overflows.
    linkRefs.current
      .get(activeId)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <nav
      aria-label="Secções desta página"
      className={cn(
        "sticky top-16 z-30 -mx-6 border-b border-border bg-background/90 backdrop-blur md:top-18",
        "lg:top-28 lg:z-auto lg:mx-0 lg:self-start lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none",
      )}
    >
      <ul className="no-scrollbar flex gap-1 overflow-x-auto px-6 py-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-l lg:border-border lg:p-0">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0">
              <a
                ref={(node) => {
                  if (node) linkRefs.current.set(item.id, node);
                  else linkRefs.current.delete(item.id);
                }}
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                onClick={(event) => handleClick(event, item.id)}
                className={cn(
                  "block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
                  "lg:-ml-px lg:rounded-none lg:border-l-2 lg:px-4 lg:py-1.5 lg:whitespace-normal",
                  active
                    ? "bg-secondary/10 font-medium text-secondary lg:border-secondary lg:bg-transparent"
                    : "text-muted-foreground hover:text-foreground lg:border-transparent lg:hover:border-border",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
