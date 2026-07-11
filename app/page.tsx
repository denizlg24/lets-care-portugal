import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/layout/logo-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const revalidate = 86400;

type Partner = {
  name: string;
  src: string;
};

const partners: Partner[] = [
  //{ name: "LeTs-Care Portugal", src: "/lets_care_logo_transparente.png" },
  { name: "Universidade do Porto", src: "/partners/UNI-PORTO.jpg" },
  // { name: "União Europeia", src: "/partners/eu.jpg" },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="relative isolate -mt-16 w-full flex-1 overflow-hidden md:-mt-18">
        <AuroraBackground />

        <main className="relative mx-auto w-full max-w-6xl px-6 pt-32 pb-16 md:pt-38 md:pb-20 short:pt-24 short:pb-10">
          <section className="flex flex-col items-center text-center">
            <div
              className="w-full max-w-sm animate-fade-up sm:max-w-md md:max-w-lg lg:max-w-2xl short:max-w-sm"
              style={{ animationDelay: "0ms" }}
            >
              <LogoMark priority />
            </div>

            <h1
              className="mt-8 max-w-3xl animate-fade-up text-balance font-heading text-3xl font-extrabold leading-tight text-primary sm:text-4xl md:text-5xl short:mt-5 short:text-3xl"
              style={{ animationDelay: "120ms" }}
            >
              LeTs-Care Portugal
            </h1>

            <p
              className="mt-5 max-w-2xl animate-fade-up text-pretty text-xl leading-relaxed text-muted-foreground md:text-2xl short:mt-3 short:text-lg"
              style={{ animationDelay: "220ms" }}
            >
              Desafios e Oportunidades das Respostas Sociais para Pessoas Mais Velhas
            </p>

            <div
              className="mt-8 flex animate-fade-up flex-col items-center gap-4 short:mt-6 short:gap-3"
              style={{ animationDelay: "320ms" }}
            >
              <Button
                size="lg"
                nativeButton={false}
                className="h-14 rounded-full border-0 px-10 text-lg font-semibold shadow-md shadow-primary/20 md:text-xl short:h-12 short:px-8 short:text-base"
                render={<Link href="/sobre-nos">Saber Mais</Link>}
              ></Button>
              <Link
                href="/contactos"
                className="font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
              >
                Ou entre em contacto connosco
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="partners-heading"
            className="mt-16 animate-fade-up md:mt-20 short:mt-10"
            style={{ animationDelay: "420ms" }}
          >
            <h2
              id="partners-heading"
              className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground md:text-base"
            >
              Uma iniciativa
            </h2>

            <div className="group relative left-1/2 mt-8 w-full -translate-x-1/2 overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <ul className="flex w-full flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16">
                {partners.map((partner) => (
                  <li key={partner.name} className="shrink-0">
                    <div className="relative h-9 w-28 opacity-90 transition-opacity duration-200 hover:opacity-100 sm:h-10 sm:w-32 md:h-12 md:w-40">
                      <Image
                        src={partner.src}
                        alt={partner.name}
                        fill
                        sizes="160px"
                        className="object-contain"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}

function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 flex justify-center md:top-12">
        <div className="h-136 w-136 animate-glow-drift rounded-full bg-secondary/12 blur-3xl" />
      </div>
    </div>
  );
}
