/**
 * Dashboard route loading — shown while /dashboard compiles/transitions.
 */
import { Skeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-1.5">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
