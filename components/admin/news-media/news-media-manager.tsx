"use client";

import { FileText, Images, Newspaper } from "lucide-react";
import { useState } from "react";
import { NewsItemManager } from "@/components/admin/news-media/news-item-manager";
import { NewsletterManager } from "@/components/admin/news-media/newsletter-manager";
import { ProjectPhotoManager } from "@/components/admin/news-media/project-photo-manager";
import type { NewsItem, NewsletterItem, PhotoItem } from "@/components/admin/news-media/shared";
import { cn } from "@/lib/utils";

interface NewsMediaManagerProps {
  newsletters: NewsletterItem[];
  photos: PhotoItem[];
  news: NewsItem[];
}

const TABS = [
  { key: "newsletters", label: "Newsletters", icon: FileText },
  { key: "fotografias", label: "Fotografias", icon: Images },
  { key: "noticias", label: "Notícias", icon: Newspaper },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function NewsMediaManager({ newsletters, photos, news }: NewsMediaManagerProps) {
  const [tab, setTab] = useState<TabKey>("newsletters");

  return (
    <div className="space-y-6">
      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Notícias e media"
      >
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
                "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* All panels stay mounted; inactive ones are hidden so each manager
          keeps its local (optimistic) state when switching tabs. */}
      <div className="pt-2">
        <div
          id="panel-newsletters"
          role="tabpanel"
          aria-labelledby="tab-newsletters"
          hidden={tab !== "newsletters"}
        >
          <NewsletterManager initial={newsletters} />
        </div>
        <div
          id="panel-fotografias"
          role="tabpanel"
          aria-labelledby="tab-fotografias"
          hidden={tab !== "fotografias"}
        >
          <ProjectPhotoManager initial={photos} />
        </div>
        <div
          id="panel-noticias"
          role="tabpanel"
          aria-labelledby="tab-noticias"
          hidden={tab !== "noticias"}
        >
          <NewsItemManager initial={news} />
        </div>
      </div>
    </div>
  );
}
