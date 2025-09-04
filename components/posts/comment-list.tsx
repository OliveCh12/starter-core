"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  };
}

interface CommentListProps {
  postId: number;
  comments: Comment[];
}

export function CommentList({ postId, comments }: CommentListProps) {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (comments.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const authorName = `${comment.author.firstName} ${comment.author.lastName}`.trim();
        
        return (
          <div key={comment.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author.profileImageUrl || ''} alt={authorName} />
              <AvatarFallback className="text-xs">
                {comment.author.firstName?.[0]}{comment.author.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorName}</span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}