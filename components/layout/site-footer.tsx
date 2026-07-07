import Image from "next/image";
import Link from "next/link";
import { mainNav } from "@/lib/nav";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import logo from "@/public/lets_care_logo_transparente.png";

const legalNav = [
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos", label: "Termos e Condições" },
  { href: "/cookies", label: "Política de Cookies" },
  { href: "/acessibilidade", label: "Acessibilidade" },
];

interface SiteFooterProps {
  className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("mt-auto border-t border-border bg-muted/40", className)}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" aria-label="LeTs Care Portugal — Início">
              <Image src={logo} alt="LeTs Care Portugal" className="h-11 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <nav aria-label="Navegação do rodapé">
            <h2 className="text-sm font-semibold text-foreground">Navegação</h2>
            <ul className="mt-4 space-y-2.5">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Informação legal">
            <h2 className="text-sm font-semibold text-foreground">Legal</h2>
            <ul className="mt-4 space-y-2.5">
              {legalNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 space-y-4 border-t border-border pt-8">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Este sítio Web foi desenvolvido no âmbito de um projeto académico e de investigação.
            Financiado pela União Europeia. As opiniões e os pontos de vista expressos são, contudo,
            exclusivamente do(s) autor(es) e não refletem necessariamente os da União Europeia nem
            os da entidade financiadora, que não podem ser responsabilizados por eles.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            As marcas, logótipos e conteúdos das universidades e instituições parceiras são
            propriedade dos respetivos titulares e são utilizados apenas para fins informativos e
            educativos.
          </p>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {year} {siteConfig.name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
