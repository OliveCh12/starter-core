'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Monitor, Sun, Moon, Type, RotateCcw } from 'lucide-react';
import { UserPreferences } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' }
];

export default function AppearancePage() {
  const { data: preferences, error } = useSWR<UserPreferences>('/api/user/preferences', fetcher);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { setTheme } = useTheme();

  const updatePreference = async (key: string, value: any) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });

      if (response.ok) {
        // Update the global theme immediately if theme was changed
        if (key === 'theme') {
          setTheme(value);
        }
        
        toast.success('Appearance updated', {
          description: `${key.charAt(0).toUpperCase() + key.slice(1)} has been changed successfully`,
        });
        mutate('/api/user/preferences');
      } else {
        toast.error('Update failed', {
          description: 'Unable to save appearance settings. Please try again.',
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

  const resetToDefaults = async () => {
    setIsResetting(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          theme: 'system',
          language: 'en'
        })
      });

      if (response.ok) {
        // Reset theme to system default
        setTheme('system');
        
        toast.success('Settings reset', {
          description: 'All appearance settings have been restored to default values',
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        });
        mutate('/api/user/preferences');
      } else {
        toast.error('Reset failed', {
          description: 'Unable to reset settings. Please try again.',
        });
      }
    } catch (error) {
      toast.error('Connection error', {
        description: 'Unable to connect to server. Check your internet connection.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
          <p className="text-muted-foreground">
            Customize the look and feel of your dashboard.
          </p>
        </div>
        <div className="text-red-500">Failed to load preferences</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
          <p className="text-muted-foreground">
            Customize the look and feel of your dashboard.
          </p>
        </div>
        <div className="animate-pulse">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
        <p className="text-muted-foreground">
          Customize the look and feel of your dashboard.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme
            </CardTitle>
            <CardDescription>
              Choose your preferred theme for the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={preferences.theme} 
              onValueChange={(value) => updatePreference('theme', value)}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                  <Sun className="h-4 w-4" />
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                  <Moon className="h-4 w-4" />
                  Dark
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  System
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Language
            </CardTitle>
            <CardDescription>
              Choose your preferred language for the interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={preferences.language}
              onValueChange={(value) => updatePreference('language', value)}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset to Defaults
            </CardTitle>
            <CardDescription>
              Reset all appearance settings to their default values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              disabled={isResetting || isUpdating}
            >
              {isResetting ? 'Resetting...' : 'Reset Appearance Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}