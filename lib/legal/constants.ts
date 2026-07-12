// Lives here (not in models/LegalPage.ts) so client components can import the
// slugs without dragging mongoose into the browser bundle.
export const LEGAL_SLUGS = ["privacidade", "termos", "cookies", "acessibilidade"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalPageMeta {
  /** Navigation label (matches the footer links). */
  label: string;
  /** Public route of the page. */
  path: string;
  /** SEO description for the public page. */
  description: string;
}

export const LEGAL_PAGE_META: Record<LegalSlug, LegalPageMeta> = {
  privacidade: {
    label: "Política de Privacidade",
    path: "/privacidade",
    description:
      "Como o projeto LeTs-Care Portugal trata os seus dados pessoais, ao abrigo do RGPD e da lei portuguesa.",
  },
  termos: {
    label: "Termos e Condições",
    path: "/termos",
    description:
      "Condições de utilização do site do projeto LeTs-Care Portugal: conteúdos, comentários, propriedade intelectual e responsabilidade.",
  },
  cookies: {
    label: "Política de Cookies",
    path: "/cookies",
    description:
      "Os cookies e o armazenamento local utilizados pelo site do projeto LeTs-Care Portugal, e como os gerir.",
  },
  acessibilidade: {
    label: "Acessibilidade",
    path: "/acessibilidade",
    description:
      "Declaração de acessibilidade do site do projeto LeTs-Care Portugal: estado de conformidade com as WCAG 2.1 e vias de contacto.",
  },
};
