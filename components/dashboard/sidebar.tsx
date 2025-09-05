'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  User, 
  Settings, 
  Shield, 
  Activity, 
  Menu, 
  Newspaper,
  LogOut,
  ArrowLeft,
  Home,
  Bell,
  Palette
} from 'lucide-react';
import { signOut } from '@/app/(login)/actions';

const navigationItems = [
  { href: '/dashboard/profil', icon: User, label: 'Profile' },
  { href: '/dashboard', icon: Users, label: 'Team' },
  { href: '/dashboard/posts', icon: Newspaper, label: 'Posts' },
];

const settingsItems = [
  { href: '/dashboard/settings/general', icon: Settings, label: 'General' },
  { href: '/dashboard/settings/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/settings/appearance', icon: Palette, label: 'Appearance' },
  { href: '/dashboard/settings/activity', icon: Activity, label: 'Activity' },
  { href: '/dashboard/settings/security', icon: Shield, label: 'Security' },
];

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ isSidebarOpen, setIsSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check if we're on a settings route
  const isSettingsRoute = pathname?.startsWith('/dashboard/settings');

  // Determine which items to show
  const currentNavItems = isSettingsRoute ? settingsItems : navigationItems;
  const sectionTitle = isSettingsRoute ? 'Settings' : 'Navigation';

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <aside
        className={`
          w-64 bg-background border-r h-full shrink-0
          lg:block lg:relative lg:translate-x-0 
          ${isSidebarOpen ? 'block' : 'hidden lg:block'}
          fixed lg:static inset-y-0 left-0 z-40 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
      <nav className="h-full p-4 flex flex-col">
        {/* Back to Dashboard - Top of sidebar when in settings */}
        {isSettingsRoute && (
          <div className="mb-6 pb-4 border-b">
            <Link href="/dashboard" passHref>
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Dynamic Navigation Section */}
          <div className="mb-8">
            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {sectionTitle}
            </h3>
            <div className="space-y-1">
              {currentNavItems.map((item) => (
                <Link key={item.href} href={item.href} passHref>
                  <Button
                    variant={pathname === item.href ? 'default' : 'ghost'}
                    className="shadow-none w-full justify-start"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section - Settings and Logout - Always visible */}
        <div className="pt-4 border-t space-y-2 shrink-0">
          {/* Settings Button - Always visible */}
          {!isSettingsRoute && (
            <Link href="/dashboard/settings" passHref>
              <Button
                variant="ghost"
                className="shadow-none w-full justify-start"
                onClick={() => setIsSidebarOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          )}
          
          {/* Logout Button */}
          <Button
            variant="ghost"
            className="shadow-none w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </nav>
    </aside>
    </>
  );
}