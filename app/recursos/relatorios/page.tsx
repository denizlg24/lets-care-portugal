import type { Metadata } from "next";
import { ResourcesIndexPage } from "@/components/resources/resources-index-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Relatórios do projeto",
  description:
    "Todos os relatórios produzidos ao longo do projeto LeTs-Care Portugal, por ordem cronológica.",
  alternates: { canonical: "/recursos/relatorios" },
  openGraph: {
    type: "website",
    url: "/recursos/relatorios",
    title: "Relatórios do projeto | LeTs-Care Portugal",
    description: "Todos os relatórios produzidos ao longo do projeto LeTs-Care Portugal.",
  },
};

interface PageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

export default function Page({ searchParams }: PageProps) {
  return <ResourcesIndexPage type="report" searchParams={searchParams} />;
}
