import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { DEFAULT_MISSION_IMAGES } from "@/lib/about/defaults";
import { getAboutSettings } from "@/lib/about/service";
import { getFaIcon } from "@/lib/icons/registry";
import { cn } from "@/lib/utils";
import type { ITeamMember } from "@/models/AboutSettings";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Conheça a missão e a equipa do LeTs-Care Portugal — quem somos e como trabalhamos o futuro do envelhecimento em Portugal.",
  alternates: { canonical: "/sobre-nos" },
  openGraph: {
    type: "website",
    url: "/sobre-nos",
    title: "Sobre Nós | LeTs-Care Portugal",
    description:
      "Conheça a missão e a equipa do LeTs-Care Portugal — quem somos e como trabalhamos o futuro do envelhecimento em Portugal.",
  },
};

// Shown while the admin hasn't written a mission yet.
const FALLBACK_MISSION =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

// 2×2 collage next to the mission text: only the outer corners are rounded.
const MISSION_IMAGE_CORNERS = [
  "rounded-tl-3xl",
  "rounded-tr-3xl",
  "rounded-bl-3xl",
  "rounded-br-3xl",
] as const;

function MemberLinkItem({ link }: { link: ITeamMember["links"][number] }) {
  const Icon = getFaIcon(link.icon);
  return (
    <li>
      <a
        href={link.href}
        target={link.href.startsWith("http") ? "_blank" : undefined}
        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
        aria-label={link.label}
        title={link.label}
        className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-secondary hover:bg-secondary hover:text-secondary-foreground"
      >
        {Icon ? <Icon className="size-4" aria-hidden /> : null}
      </a>
    </li>
  );
}

function TeamMemberCard({ member }: { member: ITeamMember }) {
  return (
    <li className="flex flex-col">
      <div className="group relative aspect-4/5 w-full overflow-hidden rounded-t-full bg-muted shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        {member.image ? (
          <Image
            src={member.image}
            alt={`Fotografia de ${member.name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-end justify-center text-muted-foreground/60">
            <UserRound className="mb-[12%] size-1/3" strokeWidth={1} aria-hidden />
          </div>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{member.name}</h3>
      {member.abstract ? (
        <p className="mt-1 text-sm text-muted-foreground">{member.abstract}</p>
      ) : null}
      {member.links.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {member.links.map((link) => (
            <MemberLinkItem key={`${link.label}-${link.href}`} link={link} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function AboutPage() {
  const { mission, missionImages, team } = await getAboutSettings();

  const missionParagraphs = (mission || FALLBACK_MISSION)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  // Admin-picked images override the bundled defaults slot by slot.
  const missionTiles = DEFAULT_MISSION_IMAGES.map((fallback, index) => {
    const custom = missionImages[index];
    return custom?.image
      ? { src: custom.image, alt: custom.alt || fallback.alt, corner: MISSION_IMAGE_CORNERS[index] }
      : { src: fallback.src, alt: fallback.alt, corner: MISSION_IMAGE_CORNERS[index] };
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Sobre Nós</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Quem somos
          </h1>
        </header>

        <section
          aria-labelledby="missao"
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <div>
            <h2 id="missao" className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              A nossa missão
            </h2>
            <div className="mt-4 space-y-4">
              {missionParagraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-pretty text-base leading-7 text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {missionTiles.map((image) => (
              <div
                key={image.corner}
                className={cn(
                  "group relative aspect-4/3 overflow-hidden bg-muted shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
                  image.corner,
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="equipa" className="mt-20 md:mt-24">
          <h2 id="equipa" className="font-heading text-xl font-bold text-foreground sm:text-2xl">
            A nossa equipa
          </h2>
          {team.length > 0 ? (
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
              {team.map((member) => (
                <TeamMemberCard key={member.name} member={member} />
              ))}
            </ul>
          ) : (
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Em breve vamos apresentar aqui a equipa do LeTs-Care Portugal.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
