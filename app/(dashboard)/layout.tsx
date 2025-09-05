'use client';

import { Header } from '@/components/layout/header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </section>
  );
}
