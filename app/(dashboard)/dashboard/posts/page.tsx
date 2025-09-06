"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { User } from '@/lib/db/schema';
import { PostCard, PostWithDetails } from '@/components/posts/post-card';
import { useRouter } from 'next/navigation';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};




const PostsPage = () => {
  const { data: posts, error, isLoading, mutate } = useSWR<PostWithDetails[]>("/api/posts", fetcher);
  const { data: currentUser } = useSWR<User>("/api/user", fetcher);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Posts</h1>
          <Skeleton className="h-9 w-24" />
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Posts</h1>
        <Card>
          <CardContent className="p-6">
            <div className="text-destructive">
              Failed to load posts: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Posts</h1>
        <Button 
          size="sm"
          onClick={() => router.push('/dashboard/posts/create')}
        >
          New Post
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={currentUser?.id}
              onUpdate={mutate}
            />
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No posts found. Create your first post to get started!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PostsPage;