import { ArrowRight, FileText, Inbox, MessageSquare, Newspaper, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PendingCommentsBadge } from "@/components/admin/pending-comments-badge";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Acesso",
    description: "Aprovar pedidos de administração e gerir administradores existentes.",
    href: "/admin/access",
    icon: ShieldCheck,
    ready: true,
    pendingCount: false,
  },
  {
    title: "Blogue",
    description: "Criar, editar, publicar e arquivar artigos.",
    href: "/admin/blogs",
    icon: FileText,
    ready: true,
    pendingCount: false,
  },
  {
    title: "Notícias & Media",
    description: "Gerir newsletters, fotografias de projetos e notícias.",
    href: "/admin/media",
    icon: Newspaper,
    ready: true,
    pendingCount: false,
  },
  {
    title: "Contactos",
    description: "Rever pedidos recebidos de apoio e parcerias.",
    href: null,
    icon: Inbox,
    ready: false,
    pendingCount: false,
  },
  {
    title: "Comentários",
    description: "Moderar comentários e respostas do blogue.",
    href: "/admin/blogs/comments",
    icon: MessageSquare,
    ready: true,
    pendingCount: true,
  },
] as const;

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Início</p>
        <h1 className="text-xl font-semibold text-foreground">Painel de administração</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gerir acesso, conteúdos e pedidos recebidos.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Áreas
        </h2>
        <ul className="divide-y divide-border border-y border-border">
          {sections.map((section) => {
            const Icon = section.icon;
            const row = (
              <div className="flex items-center gap-3 px-1 py-3">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    section.ready ? "text-accent" : "text-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{section.title}</span>
                    {!section.ready ? (
                      <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                        Em breve
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{section.description}</p>
                </div>
                {section.pendingCount ? (
                  <PendingCommentsBadge compact={false} className="shrink-0" />
                ) : null}
                {section.ready ? (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                ) : null}
              </div>
            );

            return (
              <li key={section.title}>
                {section.href ? (
                  <Link className="block transition-colors hover:bg-muted/50" href={section.href}>
                    {row}
                  </Link>
                ) : (
                  <div className="opacity-55">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
