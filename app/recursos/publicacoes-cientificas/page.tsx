import type { Metadata } from "next";
import { ResourcesIndexPage } from "@/components/resources/resources-index-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Publicações científicas",
  description:
    "Todas as publicações científicas do projeto LeTs-Care Portugal em revistas e conferências, por ordem cronológica.",
  alternates: { canonical: "/recursos/publicacoes-cientificas" },
  openGraph: {
    type: "website",
    url: "/recursos/publicacoes-cientificas",
    title: "Publicações científicas | LeTs-Care Portugal",
    description:
      "Todas as publicações científicas do projeto LeTs-Care Portugal em revistas e conferências.",
  },
};

interface PageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

export default function Page({ searchParams }: PageProps) {
  return <ResourcesIndexPage type="paper" searchParams={searchParams} />;
}
