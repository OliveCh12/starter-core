import Link from 'next/link';
import { FileX, Home, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-muted p-4">
                <FileX className="size-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              404 - Page Not Found
            </CardTitle>
            <CardDescription className="text-base">
              The page you're looking for doesn't exist or has been moved to a different location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/">
                  <Home className="size-4" />
                  Go Home
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
                <ArrowLeft className="size-4" />
                Go Back
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              If you believe this is an error, please contact our support team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
