// Lives here (not in models/Resource.ts) so client components can import the
// enum without dragging mongoose into the browser bundle.
export const RESOURCE_TYPES = ["report", "paper", "policy-brief", "pedagogic"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export interface ResourceTypeMeta {
  /** Portuguese section title on the public page and admin tab label. */
  label: string;
  /** Singular form for admin form headings and confirmation messages. */
  singular: string;
  /** Anchor id of the section on /recursos. */
  sectionId: string;
  /** Short section intro on the public page. */
  blurb: string;
}

export const RESOURCE_TYPE_META: Record<ResourceType, ResourceTypeMeta> = {
  report: {
    label: "Relatórios do projeto",
    singular: "relatório",
    sectionId: "relatorios",
    blurb: "Os relatórios produzidos ao longo do projeto LeTs-Care Portugal.",
  },
  paper: {
    label: "Artigos científicos",
    singular: "artigo científico",
    sectionId: "artigos-cientificos",
    blurb: "Publicações científicas do projeto em revistas e conferências.",
  },
  "policy-brief": {
    label: "Recomendações Políticas",
    singular: "recomendação política",
    sectionId: "policy-briefs",
    blurb: "Recomendações de políticas públicas baseadas nos resultados do projeto.",
  },
  pedagogic: {
    label: "Materiais pedagógicos e interativos",
    singular: "material pedagógico",
    sectionId: "materiais-pedagogicos",
    blurb: "Jogos, atividades e outros materiais interativos para explorar no browser.",
  },
};
