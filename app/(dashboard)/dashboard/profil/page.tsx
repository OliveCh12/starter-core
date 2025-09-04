"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";
import { Check, Pencil, UserCircle2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Define TypeScript interfaces
interface User {
  name: string;
  email: string;
  role: string;
}

interface ActionState {
  name?: string;
  error?: string;
  success?: string;
}

// Fetcher function with better error handling
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

const AccountPage = () => {
  const { data: user, error, isLoading } = useSWR<User>("/api/user", fetcher);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCircle2 className="size-5" />
            Account
          </CardTitle>
          <Button 
            onClick={() => setIsEditing(!isEditing)} 
            size="sm"
            variant={isEditing ? "default" : "outline"}
          >
            {isEditing ? "Validate" : "Edit"}
            {isEditing ? (
              <Check className="ml-2 size-4" />
            ) : (
              <Pencil className="ml-2 size-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Manage your account settings and set email preferences.
          </p>
          
          <div className="space-y-2 pt-2">

            
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Name:</span>
              <span className="text-sm">
                {user?.name || "N/A"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Email:</span>
              <span className="text-sm">
                {user?.email || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Role:</span>
              <Badge variant={"secondary"}>
                {user?.role || "N/A"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;