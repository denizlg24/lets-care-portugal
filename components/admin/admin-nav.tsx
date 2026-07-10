"use client";

import { FileText, Home, Inbox, Newspaper, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Início", icon: Home },
  { href: "/admin/blogs", label: "Blogue", icon: FileText },
  { href: "/admin/media", label: "Notícias & Media", icon: Newspaper },
  { href: "/admin/contacts", label: "Contactos", icon: Inbox },
  { href: "/admin/about", label: "Sobre Nós", icon: Users },
  { href: "/admin/access", label: "Acesso", icon: ShieldCheck },
] as const;

interface AdminNavProps {
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function AdminNav({ orientation = "vertical", className }: AdminNavProps) {
  const pathname = usePathname();

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
        const active =
          pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
