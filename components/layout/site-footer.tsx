import Image from "next/image";
import Link from "next/link";
import { mainNav } from "@/lib/nav";
import { getSiteConfig } from "@/lib/settings/service";
import { cn } from "@/lib/utils";
import logo from "@/public/lets_care_logo_transparente.png";
import oceanInformatix from "@/public/oceaninformatix.svg";
import fundedByEu from "@/public/PT_FundedbytheEU_RGB_POS.png";

const legalNav = [
  { href: "/privacidade", label: "Política de Privacidade" },
  { href: "/termos", label: "Termos e Condições" },
  { href: "/cookies", label: "Política de Cookies" },
  { href: "/acessibilidade", label: "Acessibilidade" },
];

interface SiteFooterProps {
  className?: string;
}

export async function SiteFooter({ className }: SiteFooterProps) {
  const config = await getSiteConfig();
  const year = new Date().getFullYear();

  return (
    <footer className={cn("mt-auto border-t border-border bg-muted/40", className)}>
      <div className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label={`${config.name} — Início`}
              className="font-extrabold font-heading"
            >
              {/* <Image src={logo} alt="LeTs Care Portugal" className="h-11 w-auto" /> */}
              {config.name}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {config.description}
            </p>
            {config.consortiumText ? (
              <p className="text-sm leading-relaxed text-muted-foreground font-semibold mt-2">
                {config.consortiumText}
              </p>
            ) : null}

            {config.consortiumHref ? (
              <Link
                href={config.consortiumHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block"
              >
                <Image src={logo} alt="LeTs-Care" className="h-11 w-auto" width={150} height={50} />
              </Link>
            ) : null}
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
          <div className="space-y-3">
            {config.projectLine ? (
              <p className="text-sm font-semibold text-foreground">{config.projectLine}</p>
            ) : null}
            <Image
              src={fundedByEu}
              alt="Financiado pela União Europeia"
              className="h-11 w-auto md:h-12"
            />
          </div>

          {config.fundingDisclaimer ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {config.fundingDisclaimer}
            </p>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">
            As marcas, logótipos e conteúdos das universidades e instituições parceiras são
            propriedade dos respetivos titulares e são utilizados apenas para fins informativos e
            educativos.
          </p>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {year} {config.name}. Todos os direitos reservados.
            </p>
            <Link
              href="https://oceaninformatix.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
            >
              Desenvolvido por
              <Image src={oceanInformatix} alt="Ocean Informatix" className="h-4 w-auto" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
