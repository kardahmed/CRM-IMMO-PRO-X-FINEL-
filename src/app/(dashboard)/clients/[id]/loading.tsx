import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDetailLoading() {
  return (
    <div className="space-y-6 animate-page-enter">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
