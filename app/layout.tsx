import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope, Inter, Roboto } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });
const inter = Inter({ subsets: ['latin']});
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'] });


export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${roboto.className}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-background text-foreground">
        <ThemeProvider>
          <SWRConfig
            value={{
              fallback: {
                // We do NOT await here
                // Only components that read this data will suspend
                '/api/user': getUser(),
                '/api/team': getTeamForUser()
              }
            }}
          >
            {children}
            <Toaster richColors closeButton />
          </SWRConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
