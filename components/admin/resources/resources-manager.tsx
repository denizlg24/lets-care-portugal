"use client";

import { BookOpenCheck, FileChartColumn, Puzzle, ScrollText } from "lucide-react";
import { useState } from "react";
import { ResourceManager } from "@/components/admin/resources/resource-manager";
import type { ResourceItem } from "@/components/admin/resources/shared";
import { RESOURCE_TYPE_META, RESOURCE_TYPES, type ResourceType } from "@/lib/resources/constants";
import { cn } from "@/lib/utils";

interface ResourcesManagerProps {
  resources: ResourceItem[];
}

const TAB_ICONS: Record<ResourceType, typeof ScrollText> = {
  report: FileChartColumn,
  paper: BookOpenCheck,
  "policy-brief": ScrollText,
  pedagogic: Puzzle,
};

export function ResourcesManager({ resources }: ResourcesManagerProps) {
  const [tab, setTab] = useState<ResourceType>("report");

  return (
    <div className="space-y-6">
      <div
        className="flex gap-1 overflow-x-auto border-b border-border"
        role="tablist"
        aria-label="Recursos"
      >
        {RESOURCE_TYPES.map((type) => {
          const Icon = TAB_ICONS[type];
          const active = tab === type;
          return (
            <button
              key={type}
              id={`tab-${type}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${type}`}
              onClick={() => setTab(type)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {RESOURCE_TYPE_META[type].label}
            </button>
          );
        })}
      </div>

      {/* All panels stay mounted; inactive ones are hidden so each manager
          keeps its local (optimistic) state when switching tabs. */}
      <div className="pt-2">
        {RESOURCE_TYPES.map((type) => (
          <div
            key={type}
            id={`panel-${type}`}
            role="tabpanel"
            aria-labelledby={`tab-${type}`}
            hidden={tab !== type}
          >
            <ResourceManager
              type={type}
              initial={resources.filter((resource) => resource.type === type)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
