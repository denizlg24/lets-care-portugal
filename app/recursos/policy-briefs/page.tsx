import type { Metadata } from "next";
import { ResourcesIndexPage } from "@/components/resources/resources-index-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Policy briefs (Recomendações)",
  description:
    "Todos os policy briefs (recomendações) baseados nos resultados do projeto LeTs-Care Portugal.",
  alternates: { canonical: "/recursos/policy-briefs" },
  openGraph: {
    type: "website",
    url: "/recursos/policy-briefs",
    title: "Policy briefs (Recomendações) | LeTs-Care Portugal",
    description:
      "Todos os policy briefs (recomendações) baseados nos resultados do projeto LeTs-Care Portugal.",
  },
};

interface PageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

export default function Page({ searchParams }: PageProps) {
  return <ResourcesIndexPage type="policy-brief" searchParams={searchParams} />;
}
