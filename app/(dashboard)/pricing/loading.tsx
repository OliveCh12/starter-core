import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PricingLoading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section Loading */}
        <div className="text-center mb-16">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-[500px] mx-auto" />
        </div>

        {/* Pricing Cards Loading */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[1, 2].map((index) => (
            <Card key={index} className="pt-8">
              <CardHeader className="text-center pb-8">
                <Skeleton className="h-6 w-6 mx-auto mb-4" />
                <Skeleton className="h-8 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto mb-4" />
                <Skeleton className="h-12 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-40 mx-auto" />
              </CardHeader>

              <CardContent className="px-8">
                <div className="space-y-4 mb-8">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="flex items-start">
                      <Skeleton className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <Skeleton className="h-4 w-40 ml-3" />
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="px-8 pt-0">
                <Skeleton className="h-12 w-full rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Footer Loading */}
        <div className="mt-16 text-center">
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    </main>
  );
}
