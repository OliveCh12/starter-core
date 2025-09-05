'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';
import { User, UserPreferences } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function AccountSection() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Initialize form values when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email
        })
      });

      if (response.ok) {
        toast.success('Account updated', {
          description: 'Your account information has been updated successfully',
        });
        mutate('/api/user');
      } else {
        toast.error('Update failed', {
          description: 'Unable to update your account. Please try again.',
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

  if (!user) {
    return <div className="animate-pulse">Loading account information...</div>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="firstName" className="mb-2">
          First Name
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Enter your first name"
          required
          maxLength={100}
        />
      </div>
      
      <div>
        <Label htmlFor="lastName" className="mb-2">
          Last Name
        </Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Enter your last name"
          required
          maxLength={100}
        />
      </div>
      
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      
      <Button type="submit" disabled={isUpdating}>
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  );
}

const visibilityOptions = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'friends_only', label: 'Friends Only' }
];

function PreferencesSection() {
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
        toast.success('Settings updated', {
          description: 'Your preferences have been saved successfully',
        });
        mutate('/api/user/preferences');
      } else {
        toast.error('Update failed', {
          description: 'Unable to save your preferences. Please try again.',
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
    return <div className="text-red-500">Failed to load preferences</div>;
  }

  if (!preferences) {
    return <div className="animate-pulse">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Control your privacy and visibility settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Profile Visibility</Label>
            <Select
              value={preferences.profileVisibility}
              onValueChange={(value) => updatePreference('profileVisibility', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <div className="text-sm text-muted-foreground">
                Let others see when you're active
              </div>
            </div>
            <Switch
              checked={preferences.showOnlineStatus}
              onCheckedChange={(checked) => updatePreference('showOnlineStatus', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GeneralPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSection />
        </CardContent>
      </Card>

      <Separator />
      
      <PreferencesSection />
    </div>
  );
}
