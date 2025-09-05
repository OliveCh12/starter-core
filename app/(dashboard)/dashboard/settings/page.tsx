'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Activity, Shield, Bell, User, Palette } from 'lucide-react';

const settingsSections = [
  {
    id: 'general',
    title: 'General',
    description: 'Manage your account settings and preferences',
    icon: Settings,
    href: '/dashboard/settings/general'
  },
  {
    id: 'activity',
    title: 'Activity',
    description: 'View your recent activity and logs',
    icon: Activity,
    href: '/dashboard/settings/activity'
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Manage passwords, two-factor authentication and security',
    icon: Shield,
    href: '/dashboard/settings/security'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Configure how you receive notifications',
    icon: Bell,
    href: '/dashboard/settings/notifications'
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Update your profile information and avatar',
    icon: User,
    href: '/dashboard/profil'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    icon: Palette,
    href: '/dashboard/settings/appearance'
  }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set your preferences.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Card key={section.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = section.href}
              >
                Open {section.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}