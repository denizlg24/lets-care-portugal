"use client";

import { Menu } from "lucide-react";
//import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { mainNav } from "@/lib/nav";
import { cn } from "@/lib/utils";

//import logo from "@/public/lets_care_logo_transparente.png";

interface SiteHeaderProps {
  /**
   * Forces the solid (opaque background + shadow) appearance regardless of
   * scroll position. Use on pages that don't have a hero behind the header.
   */
  solid?: boolean;
  className?: string;
}

export function SiteHeader({ solid = false, className }: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (solid) return;

    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  const isSolid = solid || scrolled;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,box-shadow,border-color] duration-300",
        isSolid
          ? "border-b border-border bg-accent-foreground shadow-sm"
          : "border-b border-transparent bg-transparent",
        className,
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6 md:h-18">
        <Link
          href="/"
          aria-label="LeTs-Care Portugal — Início"
          className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 font-extrabold font-heading"
        >
          {/* <Image src={logo} alt="LeTs Care Portugal" priority className="h-9 w-auto md:h-10" /> */}
          LeTs-Care Portugal
        </Link>

        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent transition-transform duration-200",
                        active ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav aria-label="Principal" className="flex flex-col gap-1 px-4 pb-6">
              {mainNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-md px-3 py-2.5 text-base font-medium transition-colors",
                          active
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                        )}
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
