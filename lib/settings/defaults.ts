import { siteConfig } from "@/lib/site";

/**
 * Effective site config before the admin saves the first version. `name`,
 * `shortName`, `title` and `description` mirror the bundled `siteConfig`
 * (still imported directly by pages that only need static metadata); the
 * footer strings match what was previously hardcoded in `SiteFooter`.
 */
export const DEFAULT_SITE_CONFIG = {
  name: siteConfig.name,
  shortName: siteConfig.shortName,
  title: siteConfig.title,
  description: siteConfig.description,
  consortiumText: "Aceda aqui ao consórcio europeu LeTs-Care.",
  consortiumHref: "https://www.lets-care-hub.eu/",
  projectLine: "Projeto 101132701 — LeTs-Care",
  fundingDisclaimer:
    "Financiado pela União Europeia. No entanto, os pontos de vista e as opiniões expressos são exclusivamente os do(s) autor(es) e não refletem necessariamente os da União Europeia nem os da Agência de Execução Europeia da Investigação (REA). Nem a União Europeia nem a autoridade concedente podem ser considerados responsáveis por eles.",
} as const;
