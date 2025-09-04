"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Lock, 
  Users,
  Clock,
  Tag,
  MessageCircle,
  Eye,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ReactionButton } from "./reaction-button";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { Post } from '@/lib/db/schema';
import { cn } from "@/lib/utils";

export type PostWithDetails = Post & {
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  };
  reactions: Array<{
    id: number;
    reactionType: string;
    userId: number;
  }>;
  comments: Array<{
    id: number;
    content: string;
    createdAt: string;
    author: {
      id: number;
      firstName: string;
      lastName: string;
      profileImageUrl: string;
    };
  }>;
  _count: {
    comments: number;
    reactions: number;
  };
};

interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: number;
  onUpdate?: () => void;
}

export function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  
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
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const tags = (() => {
    try {
      return post.tags ? JSON.parse(post.tags as string) : [];
    } catch {
      return typeof post.tags === 'string' ? post.tags.split(',').map(t => t.trim()) : [];
    }
  })();

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    post.reactions.forEach(reaction => {
      counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    });
    return counts;
  };

  const getUserReaction = () => {
    return post.reactions.find(reaction => reaction.userId === currentUserId);
  };

  const reactionCounts = getReactionCounts();
  const userReaction = getUserReaction();

  const handleReaction = async (reactionType: string) => {
    const formData = new FormData();
    formData.append('postId', post.id.toString());
    formData.append('reactionType', reactionType);
    
    try {
      const response = await fetch('/api/posts/reactions', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to react to post:', error);
    }
  };

  const handleCommentSuccess = () => {
    setShowCommentForm(false);
    if (onUpdate) {
      onUpdate();
    }
  };

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
                  <Clock className="h-3 w-3" />
                  {formatDate(post.createdAt)}
                </span>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  {getVisibilityIcon(post.visibility)}
                  {post.visibility.replace('_', ' ')}
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

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReactionButton
                  reactionType="like"
                  count={reactionCounts.like || 0}
                  isActive={userReaction?.reactionType === 'like'}
                  onClick={() => handleReaction('like')}
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="h-8 px-2 text-xs"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {post._count.comments}
                </Button>
                
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount}</span>
                </div>
              </div>

              {post._count.comments > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="text-xs"
                >
                  {showComments ? 'Hide' : 'Show'} Comments
                </Button>
              )}
            </div>

            {showCommentForm && (
              <div className="pt-3">
                <CommentForm
                  postId={post.id}
                  onSuccess={handleCommentSuccess}
                  compact
                />
              </div>
            )}

            {showComments && post._count.comments > 0 && (
              <div className="pt-3">
                <CommentList postId={post.id} comments={post.comments} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}