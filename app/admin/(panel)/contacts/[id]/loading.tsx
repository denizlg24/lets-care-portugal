import { Skeleton } from "@/components/ui/skeleton";

export default function AdminContactDetailLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </header>

      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
