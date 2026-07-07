import { Skeleton } from "@/components/ui/skeleton";

export default function AdminBlogsLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="space-y-3">
          {["a", "b", "c", "d", "e"].map((key) => (
            <div key={key} className="flex items-center gap-4 border-b border-border pb-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
