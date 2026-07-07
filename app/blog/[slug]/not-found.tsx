import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BlogNotFound() {
  return (
    <>
      <SiteHeader solid />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-secondary">Erro 404</p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold text-foreground md:text-4xl">
          Artigo não encontrado
        </h1>
        <p className="mt-4 text-pretty text-muted-foreground">
          O artigo que procura não existe ou já não está disponível.
        </p>
        <Link href="/blog" className={cn(buttonVariants(), "mt-8")}>
          Ver todos os artigos
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
