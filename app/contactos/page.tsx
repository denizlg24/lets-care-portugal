import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getFaIcon } from "@/lib/icons/registry";
import { getSiteSettings } from "@/lib/settings/service";
import type { ISiteLink } from "@/models/SiteSettings";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Contactos",
  description:
    "Fale com a equipa do LeTs-Care Portugal — dúvidas, parcerias, imprensa ou participação no projeto.",
  alternates: { canonical: "/contactos" },
  openGraph: {
    type: "website",
    url: "/contactos",
    title: "Contactos | LeTs-Care Portugal",
    description:
      "Fale com a equipa do LeTs-Care Portugal — dúvidas, parcerias, imprensa ou participação no projeto.",
  },
};

function ContactLinkItem({ link }: { link: ISiteLink }) {
  const Icon = getFaIcon(link.icon);
  return (
    <li>
      <a
        href={link.href}
        target={link.href.startsWith("http") ? "_blank" : undefined}
        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="group flex items-start gap-4"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
          {Icon ? <Icon className="size-4" aria-hidden /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {link.label}
          </span>
          <span className="mt-0.5 block break-words text-sm font-medium text-foreground transition-colors group-hover:text-secondary">
            {link.value || link.href}
          </span>
        </span>
      </a>
    </li>
  );
}

function SocialLinkItem({ link }: { link: ISiteLink }) {
  const Icon = getFaIcon(link.icon);
  return (
    <li>
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={link.label}
        title={link.label}
        className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-secondary hover:bg-secondary hover:text-secondary-foreground"
      >
        {Icon ? <Icon className="size-4" aria-hidden /> : null}
      </a>
    </li>
  );
}

export default async function ContactsPage() {
  const { socialLinks, contactLinks } = await getSiteSettings();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Contactos</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            Fale connosco
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Tem uma dúvida, uma proposta de parceria ou quer participar no projeto? Envie-nos uma
            mensagem — respondemos assim que possível.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          <aside className="space-y-10">
            {contactLinks.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold text-foreground">Contactos diretos</h2>
                <ul className="mt-5 space-y-5">
                  {contactLinks.map((link) => (
                    <ContactLinkItem key={`${link.label}-${link.href}`} link={link} />
                  ))}
                </ul>
              </section>
            ) : null}

            {socialLinks.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold text-foreground">Siga-nos</h2>
                <ul className="mt-5 flex flex-wrap gap-3">
                  {socialLinks.map((link) => (
                    <SocialLinkItem key={`${link.label}-${link.href}`} link={link} />
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>

          <section aria-label="Formulário de contacto">
            <ContactForm />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
