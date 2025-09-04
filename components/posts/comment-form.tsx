"use client";

import React from "react";
import { useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { createComment } from '@/app/(login)/actions';
import { ActionState } from '@/lib/auth/middleware';

interface CommentFormProps {
  postId: number;
  parentId?: number;
  onSuccess?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function CommentForm({ postId, parentId, onSuccess, placeholder = "Write a comment...", compact = false }: CommentFormProps) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createComment, { error: '' });

  React.useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      
      <Textarea
        name="content"
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        className="resize-none"
        required
      />

      {state?.error && (
        <div className="text-destructive text-xs bg-destructive/10 p-2 rounded">
          {state.error}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-3 w-3" />
              Comment
            </>
          )}
        </Button>
      </div>
    </form>
  );
}