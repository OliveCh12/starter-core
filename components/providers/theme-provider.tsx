'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';
import useSWR from 'swr';
import { UserPreferences } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ThemeSync() {
  const { setTheme } = useTheme();
  const { data: preferences } = useSWR<UserPreferences>('/api/user/preferences', fetcher);

  React.useEffect(() => {
    if (preferences?.theme) {
      setTheme(preferences.theme);
    }
  }, [preferences?.theme, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}