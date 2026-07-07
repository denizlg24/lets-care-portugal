import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import logo from "@/public/lets_care_logo_transparente.png";

type Partner = {
  name: string;
  src: string;
};

const partners: Partner[] = [
  { name: "Universidade do Porto", src: "/partners/UNI-PORTO.jpg" },
  { name: "Consejo Superior de Investigaciones Científicas (CSIC)", src: "/partners/CSIC.png" },
  { name: "Ca' Foscari University of Venice", src: "/partners/CFFILOS.png" },
  { name: "Universität Innsbruck", src: "/partners/INNSBRUCK.jpg" },
  { name: "ISM University of Management and Economics", src: "/partners/ISM.jpg" },
  { name: "Roskilde University", src: "/partners/ROSKILDE.png" },
  { name: "University of Amsterdam", src: "/partners/uvalogo.jpg" },
  {
    name: "REVES - European Network of Cities & Regions for the Social Economy",
    src: "/partners/REVES.png",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <div className="relative isolate -mt-16 w-full flex-1 overflow-hidden md:-mt-18">
        <AuroraBackground />

        <main className="relative mx-auto w-full max-w-5xl px-6 pt-32 pb-16 md:pt-38 md:pb-20">
          <section className="flex flex-col items-center text-center">
            <div
              className="w-full max-w-55 animate-fade-up sm:max-w-xs md:max-w-sm"
              style={{ animationDelay: "0ms" }}
            >
              <Image src={logo} alt="LeTs Care Portugal" priority className="h-auto w-full" />
            </div>

            <h1
              className="mt-8 max-w-3xl animate-fade-up text-balance font-heading text-2xl font-extrabold leading-tight text-primary sm:text-3xl md:text-4xl"
              style={{ animationDelay: "120ms" }}
            >
              Aprendemos com as melhores práticas de cuidados continuados para a Estratégia Europeia
              de Cuidados
            </h1>

            <p
              className="mt-5 max-w-2xl animate-fade-up text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl"
              style={{ animationDelay: "220ms" }}
            >
              Um projeto europeu de investigação que reúne universidades e instituições para
              construir um futuro com mais e melhor cuidado para todos.
            </p>

            <div
              className="mt-8 flex animate-fade-up flex-col items-center gap-4"
              style={{ animationDelay: "320ms" }}
            >
              <Button
                size="lg"
                className="h-14 rounded-full border-0 px-10 text-lg font-semibold shadow-md shadow-primary/20 md:text-xl"
              >
                Saber Mais
              </Button>
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
            className="mt-16 animate-fade-up md:mt-20"
            style={{ animationDelay: "420ms" }}
          >
            <h2
              id="partners-heading"
              className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground md:text-base"
            >
              Universidades e instituições parceiras
            </h2>

            <div className="group relative left-1/2 mt-8 w-full -translate-x-1/2 overflow-hidden mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <ul className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused]">
                {[...partners, ...partners].map((partner, index) => (
                  <li
                    key={`${partner.name}${index >= partners.length ? "-duplicate" : ""}`}
                    aria-hidden={index >= partners.length}
                    className="mr-12 shrink-0 md:mr-16"
                  >
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
      <div className="absolute inset-x-0 -top-40 flex justify-center">
        <div className="h-136 w-136 animate-glow-drift rounded-full bg-secondary/12 blur-3xl" />
      </div>
    </div>
  );
}
