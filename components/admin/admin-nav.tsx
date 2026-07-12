"use client";

import {
  FileText,
  Globe,
  Home,
  Inbox,
  LibraryBig,
  MessageSquare,
  Newspaper,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PendingCommentsBadge } from "@/components/admin/pending-comments-badge";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Início", icon: Home, pendingCount: false },
  { href: "/admin/blogs", label: "Blogue", icon: FileText, pendingCount: false },
  {
    href: "/admin/blogs/comments",
    label: "Comentários",
    icon: MessageSquare,
    pendingCount: true,
  },
  { href: "/admin/media", label: "Notícias & Media", icon: Newspaper, pendingCount: false },
  { href: "/admin/resources", label: "Recursos", icon: LibraryBig, pendingCount: false },
  { href: "/admin/contacts", label: "Contactos", icon: Inbox, pendingCount: false },
  { href: "/admin/about", label: "Sobre Nós", icon: Users, pendingCount: false },
  { href: "/admin/site", label: "Site", icon: Globe, pendingCount: false },
  { href: "/admin/legal", label: "Legal", icon: Scale, pendingCount: false },
  { href: "/admin/access", label: "Acesso", icon: ShieldCheck, pendingCount: false },
] as const;

interface AdminNavProps {
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function AdminNav({ orientation = "vertical", className }: AdminNavProps) {
  const pathname = usePathname();
  const activeHref = items
    .filter(
      (item) =>
        pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)),
    )
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <nav
      aria-label="Administração"
      className={cn(
        orientation === "vertical" ? "flex flex-col gap-0.5" : "flex gap-1 overflow-x-auto",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-w-fit items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-accent" : "text-current")} />
            <span>{item.label}</span>
            {item.pendingCount ? <PendingCommentsBadge className="ml-auto" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
