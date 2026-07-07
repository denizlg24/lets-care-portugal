import { SiteHeader } from "@/components/layout/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogIndexLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Blog</p>
          <h1 className="mt-2 text-balance font-heading text-2xl sm:text-3xl font-extrabold leading-tight text-foreground md:text-4xl lg:text-5xl">
            Ideias e boas práticas sobre cuidados
          </h1>
          <p className="mt-4 max-w-xl text-pretty sm:text-lg text-base text-muted-foreground">
            Reflexões e aprendizagens do projeto LeTs-Care Portugal sobre o futuro do
            envelhecimento.
          </p>
        </header>

        <div>
          {["a", "b", "c", "d", "e"].map((key) => (
            <div
              key={key}
              className="flex items-start gap-6 border-b border-border py-8 first:pt-0"
            >
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="aspect-4/3 w-28 shrink-0 rounded-lg sm:w-40" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
