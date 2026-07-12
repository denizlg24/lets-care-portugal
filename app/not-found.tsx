import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { mainNav } from "@/lib/nav";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

/**
 * The wandering line: a walk that strays, loops back on itself and still
 * arrives somewhere — ending in a heart. Drawn on load (`animate-draw-path`);
 * shown complete when the user prefers reduced motion.
 */
function WanderingPath() {
  return (
    <svg
      viewBox="0 0 320 260"
      fill="none"
      aria-hidden
      role="img"
      aria-label="wandering-path"
      className="w-full max-w-xs text-primary/70 lg:max-w-sm"
    >
      <circle cx="18" cy="38" r="5" className="fill-secondary" />
      <path
        d="M 18 38
           C 92 6, 158 52, 148 96
           C 140 132, 88 140, 92 106
           C 96 74, 158 78, 196 102
           C 238 128, 214 168, 250 194"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength="1"
        className="animate-draw-path"
      />
      <path
        d="M 262 196 c -3.6 -4.4 -10.8 -1.8 -10.8 3.6 c 0 4 5.4 8.6 10.8 12.8 c 5.4 -4.2 10.8 -8.8 10.8 -12.8 c 0 -5.4 -7.2 -8 -10.8 -3.6 Z"
        className="animate-fade-up fill-accent"
        style={{ animationDelay: "2.3s" }}
      />
    </svg>
  );
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex flex-1 items-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 flex justify-center md:top-12">
            <div className="h-136 w-136 animate-glow-drift rounded-full bg-secondary/12 blur-3xl" />
          </div>
        </div>

        <p
          aria-hidden
          className="pointer-events-none absolute -right-8 top-1/2 -z-10 -translate-y-1/2 -rotate-6 select-none font-heading text-[clamp(14rem,36vw,30rem)] font-extrabold leading-none text-foreground/5 md:-right-16"
        >
          404
        </p>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:py-24 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <p className="animate-fade-up text-sm font-bold uppercase tracking-wider text-secondary">
              Erro 404
            </p>
            <h1
              className="mt-3 animate-fade-up text-balance font-heading text-3xl font-extrabold leading-tight text-foreground sm:text-4xl md:text-5xl"
              style={{ animationDelay: "120ms" }}
            >
              Perdemo-nos pelo caminho.
            </h1>
            <p
              className="mt-5 max-w-md animate-fade-up text-pretty text-base text-muted-foreground sm:text-lg"
              style={{ animationDelay: "240ms" }}
            >
              A página que procura não existe, mudou de nome ou foi arrumada noutro sítio.
            </p>

            <div
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 animate-fade-up"
              style={{ animationDelay: "360ms" }}
            >
              <Link href="/" className={buttonVariants({ size: "lg" })}>
                Voltar ao início
              </Link>
              <Link
                href="/contactos"
                className="font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Ou fale connosco
              </Link>
            </div>

            <nav
              aria-label="Páginas principais"
              className="mt-12 animate-fade-up"
              style={{ animationDelay: "480ms" }}
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Alguns links úteis
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2 text-sm">
                {mainNav.map((item, index) => (
                  <li key={item.href} className="flex items-center gap-2">
                    {index > 0 && (
                      <span aria-hidden className="text-muted-foreground/40">
                        ·
                      </span>
                    )}
                    <Link
                      href={item.href}
                      className="font-medium text-secondary transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex justify-center lg:justify-end">
            <WanderingPath />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
