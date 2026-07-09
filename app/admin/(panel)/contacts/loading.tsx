import { Skeleton } from "@/components/ui/skeleton";

export default function AdminContactsLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <div className="space-y-6">
        <div className="flex gap-4 border-b border-border pb-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="ml-auto h-8 w-36" />
        </div>
        <div className="space-y-3">
          {["a", "b", "c", "d", "e"].map((key) => (
            <div key={key} className="flex items-center gap-4 border-b border-border pb-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="hidden h-4 w-28 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
