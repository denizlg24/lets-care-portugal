import { Skeleton } from "@/components/ui/skeleton";

export default function BlogDetailsLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Skeleton className="h-4 w-72 max-w-full" />
      </header>

      <div className="flex justify-end">
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>
    </div>
  );
}
