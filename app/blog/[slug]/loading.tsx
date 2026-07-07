import { SiteHeader } from "@/components/layout/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogDetailLoading() {
  return (
    <>
      <SiteHeader solid />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 md:py-16">
        <Skeleton className="mb-8 h-4 w-32" />

        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        <Skeleton className="mt-4 h-12 w-full" />
        <Skeleton className="mt-2 h-12 w-3/4" />
        <Skeleton className="mt-5 h-7 w-full" />

        <div className="mt-8 flex items-center justify-between border-y border-border py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-7 w-24" />
        </div>

        <Skeleton className="mt-10 aspect-video w-full rounded-xl" />

        <div className="mt-10 space-y-4">
          {["a", "b", "c", "d", "e", "f"].map((key) => (
            <Skeleton key={key} className="h-5 w-full" />
          ))}
          <Skeleton className="h-5 w-2/3" />
        </div>
      </main>
    </>
  );
}
