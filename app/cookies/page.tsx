import type { Metadata } from "next";
import { LegalPageView } from "@/components/legal/legal-page-view";
import { LEGAL_PAGE_META } from "@/lib/legal/constants";

export const revalidate = 86400;

const meta = LEGAL_PAGE_META.cookies;

export const metadata: Metadata = {
  title: meta.label,
  description: meta.description,
  alternates: { canonical: meta.path },
};

export default function CookiesPage() {
  return <LegalPageView slug="cookies" />;
}
