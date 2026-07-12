// Lives here (not in models/Resource.ts) so client components can import the
// enum without dragging mongoose into the browser bundle.
export const RESOURCE_TYPES = ["report", "paper", "policy-brief", "pedagogic"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface ResourceTypeMeta {
  /** Portuguese section title on the public page and admin tab label. */
  label: string;
  /** Singular form for admin form headings and confirmation messages. */
  singular: string;
  /** Anchor id of the section on /recursos; also the "see all" page slug. */
  sectionId: string;
  /** Short section intro on the public page. */
  blurb: string;
  /** Intro paragraph on the dedicated /recursos/[sectionId] "see all" page. */
  indexDescription: string;
}

export const RESOURCE_TYPE_META: Record<ResourceType, ResourceTypeMeta> = {
  report: {
    label: "Relatórios do projeto",
    singular: "relatório",
    sectionId: "relatorios",
    blurb: "Os relatórios produzidos ao longo do projeto LeTs-Care Portugal.",
    indexDescription:
      "Todos os relatórios produzidos ao longo do projeto LeTs-Care Portugal, por ordem cronológica.",
  },
  paper: {
    label: "Publicações científicas",
    singular: "publicação científica",
    sectionId: "publicacoes-cientificas",
    blurb: "Publicações científicas do projeto em revistas e conferências.",
    indexDescription:
      "Todas as publicações científicas do projeto LeTs-Care Portugal em revistas e conferências, por ordem cronológica.",
  },
  "policy-brief": {
    label: "Policy briefs (Recomendações)",
    singular: "policy brief",
    sectionId: "policy-briefs",
    blurb: "Policy briefs (Recomendações) baseadas nos resultados do projeto.",
    indexDescription:
      "Todos os policy briefs (recomendações) baseados nos resultados do projeto LeTs-Care Portugal.",
  },
  pedagogic: {
    label: "Materiais pedagógicos e interativos",
    singular: "material pedagógico",
    sectionId: "materiais-pedagogicos",
    blurb: "Jogos, atividades e outros materiais interativos para explorar no browser.",
    indexDescription:
      "Todos os jogos, atividades e materiais interativos do projeto LeTs-Care Portugal para explorar no browser.",
  },
};
