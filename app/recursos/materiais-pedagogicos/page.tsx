import type { Metadata } from "next";
import { ResourcesIndexPage } from "@/components/resources/resources-index-page";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Materiais pedagógicos e interativos",
  description:
    "Todos os jogos, atividades e materiais interativos do projeto LeTs-Care Portugal para explorar no browser.",
  alternates: { canonical: "/recursos/materiais-pedagogicos" },
  openGraph: {
    type: "website",
    url: "/recursos/materiais-pedagogicos",
    title: "Materiais pedagógicos e interativos | LeTs-Care Portugal",
    description:
      "Todos os jogos, atividades e materiais interativos do projeto LeTs-Care Portugal para explorar no browser.",
  },
};

interface PageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

export default function Page({ searchParams }: PageProps) {
  return <ResourcesIndexPage type="pedagogic" searchParams={searchParams} />;
}
