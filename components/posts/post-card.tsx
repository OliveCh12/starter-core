"use client";

// Import necessary React hooks, components, and utilities.
import React, { useState } from "react";
import { useRouter } from 'next/navigation';

// Import UI components from shadcn/ui.
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Import icons from lucide-react.
import {
  Globe,
  Lock,
  Users,
  Clock,
  Tag,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2
} from "lucide-react";

// Import date-fns for relative time formatting.
import { formatDistanceToNow } from 'date-fns';

// Import custom components and utilities.
import { ReactionButton } from "./reaction-button";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { deletePost } from '@/app/(login)/actions';
import { Post } from '@/lib/db/schema';
import { toast } from "sonner";

// --- TYPE DEFINITIONS ---

// Extends the base Post type with detailed relations for author, reactions, and comments.
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

// Props for the main PostCard component.
interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: number;
  onUpdate?: () => void;
}

// --- HELPER COMPONENTS ---

/**
 * A simple markdown renderer. It converts basic markdown syntax to HTML.
 * Note: Uses dangerouslySetInnerHTML. Ensure content is trusted.
 */
function MarkdownText({ content }: { content: string }) {
  const processMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')             // Italic
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>') // Links
      .replace(/\n/g, '<br />');                       // Line breaks
  };

  return (
    <div
      className="text-sm text-foreground/90 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: processMarkdown(content) }}
    />
  );
}

/**
 * Renders the header section of the post, including author info, timestamp, and action menu.
 */
const PostHeader = ({ post, canEdit, canDelete, onEdit, onDeleteTrigger }: {
  post: PostWithDetails;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDeleteTrigger: () => void;
}) => {
  const authorName = `${post.author.firstName} ${post.author.lastName}`.trim();

  // Helper to get the correct icon based on post visibility.
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'friends_only': return <Users className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-start justify-between gap-4">
      {/* Author Avatar and Info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={post.author.profileImageUrl || ''} alt={authorName} />
          <AvatarFallback className="text-sm">
            {post.author.firstName?.[0]}{post.author.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{authorName}</span>
          {/* Post Metadata: Timestamp and Visibility */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1 capitalize">
              {getVisibilityIcon(post.visibility)}
              {post.visibility.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Post Actions Dropdown (Edit/Delete) */}
      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Post options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Post
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem
                onClick={onDeleteTrigger}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

/**
 * Renders the main body of the post, including title, content, and tags.
 */
const PostBody = ({ title, content, tags }: {
  title?: string | null;
  content: string;
  tags: string[];
}) => (
  <div className="space-y-3">
    {title && <h3 className="text-lg font-semibold">{title}</h3>}
    <MarkdownText content={content} />
    {tags.length > 0 && (
      <div className="flex flex-wrap gap-2 pt-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary">
            <Tag className="h-3 w-3 mr-1.5" />
            {tag}
          </Badge>
        ))}
      </div>
    )}
  </div>
);

/**
 * Renders the footer section, including action buttons (React, Comment) and stats (Views).
 */
const PostFooter = ({ post, userReaction, onReaction, onToggleCommentForm, onToggleComments, showComments }: {
  post: PostWithDetails;
  userReaction: { id: number; reactionType: string; userId: number; } | undefined;
  onReaction: (reactionType: string) => void;
  onToggleCommentForm: () => void;
  onToggleComments: () => void;
  showComments: boolean;
}) => {
  const reactionCounts = post.reactions.reduce((acc, reaction) => {
    acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-2">
      <Separator />
      <div className="flex items-center justify-between">
        {/* Left-aligned actions: React, Comment count, View count */}
        <div className="flex items-center gap-2">
          <ReactionButton
            reactionType="like"
            count={reactionCounts.like || 0}
            isActive={userReaction?.reactionType === 'like'}
            onClick={() => onReaction('like')}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCommentForm}
            className="flex items-center gap-1.5 text-muted-foreground"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-semibold">{post._count.comments}</span>
          </Button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{post.viewCount}</span>
          </div>
        </div>
        {/* Right-aligned action: Show/Hide comments */}
        {post._count.comments > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={onToggleComments}
            className="text-xs"
          >
            {showComments ? 'Hide Comments' : `Show ${post._count.comments} Comments`}
          </Button>
        )}
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

/**
 * PostCard is a comprehensive component to display a single post with its details,
 * actions, reactions, and comments. It's structured into Header, Body, and Footer
 * for clarity and maintainability.
 */
export function PostCard({ post, currentUserId, onUpdate }: PostCardProps) {
  // State management for UI interactions.
  const [showComments, setShowComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  // --- DERIVED STATE & HELPERS ---

  // Safely parse tags from a string (could be JSON or comma-separated).
  const tags = (() => {
    try {
      return post.tags ? JSON.parse(post.tags as string) : [];
    } catch {
      return typeof post.tags === 'string' ? post.tags.split(',').map(t => t.trim()) : [];
    }
  })();

  // Determine if the current user has reacted to this post.
  const userReaction = post.reactions.find(reaction => reaction.userId === currentUserId);

  // Check user permissions for editing or deleting the post.
  const canEdit = currentUserId === post.author.id;
  const canDelete = currentUserId === post.author.id;

  // --- HANDLERS ---

  // Handles reaction submissions.
  const handleReaction = async (reactionType: string) => {
    const formData = new FormData();
    formData.append('postId', post.id.toString());
    formData.append('reactionType', reactionType);

    try {
      const response = await fetch('/api/posts/reactions', { method: 'POST', body: formData });
      if (response.ok) onUpdate?.();
    } catch (error) {
      console.error('Failed to react to post:', error);
    }
  };

  // Callback for successful comment submission.
  const handleCommentSuccess = () => {
    setShowCommentForm(false);
    onUpdate?.();
  };

  // Navigate to the post edit page.
  const handleEdit = () => {
    router.push(`/dashboard/posts/${post.id}/edit`);
  };

  // Handles post deletion logic.
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append('postId', post.id.toString());
      
      const result = await deletePost({ error: '' }, formData);
      
      if (result.success) {
        toast.success('Post deleted successfully');
        onUpdate?.();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };


  return (
    <>
      <Card className="overflow-hidden">
        {/* The CardContent contains the main post layout, organized vertically. */}
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <PostHeader
              post={post}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDeleteTrigger={() => setShowDeleteDialog(true)}
            />
            <PostBody title={post.title} content={post.content} tags={tags} />
            <PostFooter
              post={post}
              userReaction={userReaction}
              onReaction={handleReaction}
              onToggleCommentForm={() => setShowCommentForm(!showCommentForm)}
              onToggleComments={() => setShowComments(!showComments)}
              showComments={showComments}
            />

            {/* Conditionally render the comment form */}
            {showCommentForm && (
              <div className="pt-2">
                <CommentForm postId={post.id} onSuccess={handleCommentSuccess} compact />
              </div>
            )}

            {/* Conditionally render the comment list */}
            {showComments && post._count.comments > 0 && (
              <div className="pt-2">
                <CommentList postId={post.id} comments={post.comments} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Post'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}