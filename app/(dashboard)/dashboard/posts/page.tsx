"use client";

import React, { useState } from "react";
import { useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle, 
  Globe, 
  Lock, 
  Users,
  Calendar,
  Tag,
  Loader2
} from "lucide-react";
import { createPost, updatePost, deletePost } from '@/app/(login)/actions';
import { Post } from '@/lib/db/schema';
import { ActionState } from '@/lib/auth/middleware';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

type PostWithDetails = Post & {
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  };
  _count: {
    comments: number;
    reactions: number;
  };
};

function CreatePostForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createPost, { error: '' });

  React.useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter post title..."
              maxLength={255}
            />
          </div>
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="What's on your mind?"
              required
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select name="visibility" defaultValue="public">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="friends_only">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team Only
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="javascript, react, tutorial"
              />
            </div>
          </div>

          {state?.error && (
            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded">
              {state.error}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Publish Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PostCard({ post }: { post: PostWithDetails }) {
  const authorName = `${post.author.firstName} ${post.author.lastName}`.trim();
  
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'friends_only': return <Users className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tags = (() => {
    try {
      return post.tags ? JSON.parse(post.tags as string) : [];
    } catch {
      return typeof post.tags === 'string' ? post.tags.split(',').map(t => t.trim()) : [];
    }
  })();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.profileImageUrl || ''} alt={authorName} />
            <AvatarFallback className="text-sm">
              {post.author.firstName?.[0]}{post.author.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorName}</span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.createdAt)}
                </span>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  {getVisibilityIcon(post.visibility)}
                  {post.visibility}
                </Badge>
              </div>
            </div>

            {post.title && (
              <h3 className="font-semibold text-base">{post.title}</h3>
            )}
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span className="text-xs">{post._count.reactions}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post._count.comments}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-xs">{post.viewCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PostsPage = () => {
  const { data: posts, error, isLoading, mutate } = useSWR<PostWithDetails[]>("/api/posts", fetcher);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handlePostCreated = () => {
    mutate();
    setShowCreateForm(false);
  };

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
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {showCreateForm ? 'Cancel' : 'Create Post'}
        </Button>
      </div>

      {showCreateForm && (
        <CreatePostForm onSuccess={handlePostCreated} />
      )}

      <div className="space-y-4">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
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