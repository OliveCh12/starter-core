"use client";

import React, { useState } from "react";
import { useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useSWR from "swr";
import { Check, Pencil, UserCircle2, Loader2, Calendar, MapPin, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { updateProfile } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import { ActionState } from '@/lib/auth/middleware';

// Fetcher function with better error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

function ProfileForm({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateProfile, { error: '' });

  React.useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              defaultValue={(user as any)?.firstName || ''}
              placeholder="Enter your first name"
              required
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              defaultValue={(user as any)?.lastName || ''}
              placeholder="Enter your last name"
              required
              maxLength={100}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={user?.email || ''}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={(user as any)?.bio || ''}
            placeholder="Tell us about yourself"
            maxLength={500}
            rows={3}
          />
        </div>
        
        <div>
          <Label htmlFor="profileImageUrl">Profile Image URL</Label>
          <Input
            id="profileImageUrl"
            name="profileImageUrl"
            type="url"
            defaultValue={(user as any)?.profileImageUrl || ''}
            placeholder="https://example.com/profile.jpg"
          />
        </div>
      </div>

      <Separator />

      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={(user as any)?.dateOfBirth || ''}
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              defaultValue={(user as any)?.phoneNumber || ''}
              placeholder="+1 (555) 123-4567"
              maxLength={50}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select name="gender" defaultValue={(user as any)?.gender || 'prefer_not_to_say'}>
            <SelectTrigger>
              <SelectValue placeholder="Select your gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Address</h3>
        <div>
          <Label htmlFor="streetAddress">Street Address</Label>
          <Input
            id="streetAddress"
            name="streetAddress"
            defaultValue={(user as any)?.streetAddress || ''}
            placeholder="123 Main Street"
            maxLength={255}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={(user as any)?.city || ''}
              placeholder="New York"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="region">State/Region</Label>
            <Input
              id="region"
              name="region"
              defaultValue={(user as any)?.region || ''}
              placeholder="NY"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              name="postalCode"
              defaultValue={(user as any)?.postalCode || ''}
              placeholder="10001"
              maxLength={20}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={(user as any)?.country || ''}
            placeholder="United States"
            maxLength={100}
          />
        </div>
      </div>

      {state?.error && (
        <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
          {state.success}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function ProfileDisplay({ user }: { user: User }) {
  const fullName = `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim();
  const hasAddress = (user as any).streetAddress || (user as any).city || (user as any).region;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={(user as any).profileImageUrl || ''} alt={fullName} />
          <AvatarFallback className="text-base">
            {(user as any).firstName?.[0]}{(user as any).lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{fullName || 'Anonymous User'}</h2>
          <p className="text-muted-foreground">{user.email}</p>
          {(user as any).bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md">{(user as any).bio}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-base font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Email:</span>
            <span className="text-sm">{user.email}</span>
          </div>
          {(user as any).phoneNumber && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Phone:</span>
              <span className="text-sm">{(user as any).phoneNumber}</span>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Personal Information */}
      <div className="space-y-3">
        <h3 className="text-base font-medium flex items-center gap-2">
          <UserCircle2 className="h-4 w-4" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(user as any).dateOfBirth && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Date of Birth:</span>
              <span className="text-sm flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date((user as any).dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          )}
          {(user as any).gender && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Gender:</span>
              <span className="text-sm capitalize">{(user as any).gender.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Address Information */}
      {hasAddress && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-base font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </h3>
            <div className="space-y-2">
              {(user as any).streetAddress && (
                <div className="text-sm">{(user as any).streetAddress}</div>
              )}
              <div className="text-sm text-muted-foreground">
                {[
                  (user as any).city,
                  (user as any).region,
                  (user as any).postalCode
                ].filter(Boolean).join(', ')}
                {(user as any).country && (
                  <div className="mt-1">{(user as any).country}</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Account Information */}
      <Separator />
      <div className="space-y-3">
        <h3 className="text-base font-medium">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Email Verified:</span>
            <Badge variant={(user as any).emailVerified ? 'default' : 'secondary'}>
              {(user as any).emailVerified ? 'Verified' : 'Not Verified'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Account Status:</span>
            <Badge variant={(user as any).isActive ? 'default' : 'destructive'}>
              {(user as any).isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Member Since:</span>
            <span className="text-sm">
              {new Date((user as any).createdAt).toLocaleDateString()}
            </span>
          </div>
          {(user as any).lastActiveAt && (
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Last Active:</span>
              <span className="text-sm">
                {new Date((user as any).lastActiveAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ProfilePage = () => {
  const { data: user, error, isLoading, mutate } = useSWR<User>("/api/user", fetcher);
  const [isEditing, setIsEditing] = useState(false);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-8 w-16" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="size-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-destructive">
              Failed to load user data: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      mutate(); // Refresh user data when exiting edit mode
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4" />
            Profile
          </CardTitle>
          <Button 
            onClick={handleEditToggle}
            size="sm"
            variant={isEditing ? "outline" : "default"}
          >
{isEditing ? "Cancel" : "Edit"}
            <Pencil className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing && user ? (
            <ProfileForm user={user} onSuccess={() => {
              mutate();
              setIsEditing(false);
            }} />
          ) : (
            user && <ProfileDisplay user={user} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;