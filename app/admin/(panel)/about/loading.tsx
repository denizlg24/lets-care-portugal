import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAboutLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </header>

      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-36 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          {["a", "b"].map((key) => (
            <div key={key} className="rounded-lg border border-border p-4">
              <div className="flex gap-4">
                <Skeleton className="h-28 w-24 rounded-t-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );
}
