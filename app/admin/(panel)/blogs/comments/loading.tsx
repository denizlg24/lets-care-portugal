import { Skeleton } from "@/components/ui/skeleton";

export default function CommentsModerationLoading() {
  return (
    <div aria-label="A carregar a moderação de comentários" className="space-y-8" role="status">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </header>

      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_11rem_13rem_7rem]">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <Skeleton className="h-4 w-36" />
        <div className="rounded-xl border border-border">
          {["one", "two", "three", "four", "five"].map((key) => (
            <div className="flex items-center gap-4 border-b p-4 last:border-0" key={key}>
              <Skeleton className="size-4 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="hidden h-5 w-20 sm:block" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
