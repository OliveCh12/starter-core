import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

export default function ActivityPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          <p className="text-sm text-muted-foreground">
            Track your recent activities and account changes
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Skeleton cards for loading state */}
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 ml-auto" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-start gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
