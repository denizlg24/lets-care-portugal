"use client";

import { Inbox, Share2 } from "lucide-react";
import { useState } from "react";
import {
  LinksSettingsManager,
  type SiteLinksInitial,
} from "@/components/admin/contacts/links-settings-manager";
import { type TicketsPage, TicketsTable } from "@/components/admin/contacts/tickets-table";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "pedidos", label: "Pedidos", icon: Inbox },
  { key: "ligacoes", label: "Ligações & redes", icon: Share2 },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ContactsManagerProps {
  tickets: TicketsPage;
  links: SiteLinksInitial;
}

export function ContactsManager({ tickets, links }: ContactsManagerProps) {
  const [tab, setTab] = useState<TabKey>("pedidos");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Contactos">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              id={`tab-${key}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${key}`}
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-accent font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      {/* Both panels stay mounted; the hidden one keeps its local state
          (cursor trail, unsaved link edits) when switching tabs. */}
      <div className="pt-2">
        <div
          id="panel-pedidos"
          role="tabpanel"
          aria-labelledby="tab-pedidos"
          hidden={tab !== "pedidos"}
        >
          <TicketsTable initial={tickets} />
        </div>
        <div
          id="panel-ligacoes"
          role="tabpanel"
          aria-labelledby="tab-ligacoes"
          hidden={tab !== "ligacoes"}
        >
          <LinksSettingsManager initial={links} />
        </div>
      </div>
    </div>
  );
}
