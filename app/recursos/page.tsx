import type { Metadata } from "next";
import { SectionNav, type SectionNavItem } from "@/components/layout/section-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PedagogicCard } from "@/components/resources/pedagogic-card";
import { ResourceCard } from "@/components/resources/resource-card";
import { RESOURCE_TYPE_META, RESOURCE_TYPES, type ResourceType } from "@/lib/resources/constants";
import { listResources } from "@/lib/resources/service";
import type { ILeanResource } from "@/models/Resource";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Recursos",
  description:
    "Relatórios do projeto, publicações científicas, policy briefs e materiais pedagógicos e interativos do LeTs-Care Portugal.",
  alternates: { canonical: "/recursos" },
  openGraph: {
    type: "website",
    url: "/recursos",
    title: "Recursos | LeTs-Care Portugal",
    description:
      "Relatórios do projeto, publicações científicas, policy briefs e materiais pedagógicos e interativos do LeTs-Care Portugal.",
  },
};

const navItems: SectionNavItem[] = RESOURCE_TYPES.map((type) => ({
  id: RESOURCE_TYPE_META[type].sectionId,
  label: RESOURCE_TYPE_META[type].label,
}));

function ResourceSection({ type, items }: { type: ResourceType; items: ILeanResource[] }) {
  const meta = RESOURCE_TYPE_META[type];
  const pedagogic = type === "pedagogic";

  return (
    <section
      id={meta.sectionId}
      aria-labelledby={`${meta.sectionId}-titulo`}
      className="scroll-mt-32"
    >
      <h2
        id={`${meta.sectionId}-titulo`}
        className="font-heading text-xl font-bold text-foreground sm:text-2xl"
      >
        {meta.label}
      </h2>
      {items.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">
          Ainda não há materiais disponíveis nesta secção. Volte em breve.
        </p>
      ) : pedagogic ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {items.map((resource) => (
            <PedagogicCard key={resource._id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((resource) => (
            <ResourceCard key={resource._id} resource={resource} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function ResourcesPage() {
  const resources = await listResources({ onlyVisible: true });

  const byType = new Map<ResourceType, ILeanResource[]>(RESOURCE_TYPES.map((type) => [type, []]));
  for (const resource of resources) {
    byType.get(resource.type)?.push(resource);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-10 md:mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Recursos</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Centro de Recursos LeTs-Care
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Do rigor da ciência para o dia a dia da comunidade. Nesta secção, reunimos os principais
            resultados do trabalho desenvolvido pela equipa da UPorto. Divididos entre{" "}
            <span className="font-bold">estudos e relatórios científicos</span> (que fundamentam a
            nossa prática) e <span className="font-bold">recursos interativos</span> (prontos a usar
            pelas organizações e cidadãos), estes materiais foram criados para responder de forma
            concreta aos desafios que se colocam aos sistemas de cuidados em Portugal.
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-16">
          <SectionNav items={navItems} />

          <div className="mt-8 space-y-16 md:space-y-20 lg:mt-0">
            {RESOURCE_TYPES.map((type) => (
              <ResourceSection key={type} type={type} items={byType.get(type) ?? []} />
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
