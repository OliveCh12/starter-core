'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Users, Settings } from 'lucide-react';
import { UserPreferences } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NotificationsPage() {
  const { data: preferences, error } = useSWR<UserPreferences>('/api/user/preferences', fetcher);
  const [isUpdating, setIsUpdating] = useState(false);

  const updatePreference = async (key: string, value: any) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (response.ok) {
        toast.success('Notifications updated', {
          description: `${key.includes('email') ? 'Email' : 'Push'} notifications have been ${value ? 'enabled' : 'disabled'}`,
        });
        mutate('/api/user/preferences');
      } else {
        toast.error('Update failed', {
          description: 'Unable to save notification preferences. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Connection error', {
        description: 'Unable to connect to server. Check your internet connection.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Configure how you receive notifications and updates.
          </p>
        </div>
        <div className="text-red-500">Failed to load notification preferences</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Configure how you receive notifications and updates.
          </p>
        </div>
        <div className="animate-pulse">Loading notification preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Configure how you receive notifications and updates.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push Notifications
              {preferences.pushNotifications && (
                <Badge variant="secondary" className="text-green-700 bg-green-50">Enabled</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Receive push notifications for important updates and activities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Enable Push Notifications</div>
                <div className="text-sm text-muted-foreground">Receive browser notifications for real-time updates</div>
              </div>
              <Switch
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                disabled={isUpdating}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
              {preferences.emailNotifications && (
                <Badge variant="secondary" className="text-green-700 bg-green-50">Enabled</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Choose which email notifications you want to receive.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Enable Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive notifications via email</div>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                disabled={isUpdating}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Settings
            </CardTitle>
            <CardDescription>
              Common notification preferences for a better experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              For more detailed notification settings, visit the General settings page where you can configure privacy and online status preferences.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}