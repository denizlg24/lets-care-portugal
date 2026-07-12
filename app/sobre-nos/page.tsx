import { UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { SectionNav } from "@/components/layout/section-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { getAboutSettings } from "@/lib/about/service";
import { getFaIcon } from "@/lib/icons/registry";
import { cn } from "@/lib/utils";
import type { IAboutSection, ITeamMember } from "@/models/AboutSettings";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Conheça a missão, a visão e a equipa do LeTs-Care Portugal — quem somos e como trabalhamos o futuro do envelhecimento em Portugal.",
  alternates: { canonical: "/sobre-nos" },
  openGraph: {
    type: "website",
    url: "/sobre-nos",
    title: "Sobre Nós | LeTs-Care Portugal",
    description:
      "Conheça a missão, a visão e a equipa do LeTs-Care Portugal — quem somos e como trabalhamos o futuro do envelhecimento em Portugal.",
  },
};

const TEAM_SECTION_TITLE = "A Nossa Equipa";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Anchor ids for every section, deduplicated in case of repeated titles. */
function buildSectionIds(titles: string[]): string[] {
  const seen = new Map<string, number>();
  return titles.map((title, index) => {
    const base = slugify(title) || `seccao-${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

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

interface AboutSectionBlockProps {
  section: IAboutSection;
  id: string;
  /** Position among image-bearing sections; alternates the image side. */
  imageIndex: number;
}

function AboutSectionBlock({ section, id, imageIndex }: AboutSectionBlockProps) {
  const heading = (
    <h2 id={`${id}-titulo`} className="font-heading text-xl font-bold text-foreground sm:text-2xl">
      {section.title}
    </h2>
  );
  const body = <MarkdownRenderer content={section.body} className="mt-4" />;

  if (!section.image) {
    return (
      <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-32">
        {heading}
        {body}
      </section>
    );
  }

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="grid scroll-mt-32 items-center gap-10 lg:grid-cols-2 lg:gap-16"
    >
      <div className={cn(imageIndex % 2 === 1 && "lg:order-last")}>
        {heading}
        {body}
      </div>
      <div className="group relative aspect-4/3 overflow-hidden rounded-3xl bg-muted shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <Image
          src={section.image}
          alt={section.imageAlt || section.title}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </section>
  );
}

export default async function AboutPage() {
  const { sections, team } = await getAboutSettings();

  const ids = buildSectionIds([...sections.map((section) => section.title), TEAM_SECTION_TITLE]);
  const teamId = ids[ids.length - 1];
  const navItems = [
    ...sections.map((section, index) => ({ id: ids[index], label: section.title })),
    { id: teamId, label: TEAM_SECTION_TITLE },
  ];

  let imageCount = 0;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-10 md:mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">
            LeTs-Care Portugal
          </p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Sobre Nós
          </h1>
        </header>

        <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-16">
          <SectionNav items={navItems} />

          <div className="mt-8 space-y-16 md:space-y-20 lg:mt-0">
            {sections.map((section, index) => {
              const imageIndex = section.image ? imageCount++ : 0;
              return (
                <AboutSectionBlock
                  key={ids[index]}
                  section={section}
                  id={ids[index]}
                  imageIndex={imageIndex}
                />
              );
            })}

            <section id={teamId} aria-labelledby={`${teamId}-titulo`} className="scroll-mt-32">
              <h2
                id={`${teamId}-titulo`}
                className="font-heading text-xl font-bold text-foreground sm:text-2xl"
              >
                {TEAM_SECTION_TITLE}
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
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
