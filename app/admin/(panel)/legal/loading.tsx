import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLegalLoading() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </header>

      <div className="space-y-6">
        <Skeleton className="h-8 w-96 max-w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-9 w-44" />
      </div>
    </div>
  );
}
