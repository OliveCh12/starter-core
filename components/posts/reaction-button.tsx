"use client";

import { Button } from "@/components/ui/button";
import { Heart, ThumbsDown, Smile, Laugh, Frown, AngryIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionButtonProps {
  reactionType: 'like' | 'dislike' | 'love' | 'laugh' | 'angry' | 'sad';
  count: number;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const reactionIcons = {
  like: Heart,
  dislike: ThumbsDown,
  love: Heart,
  laugh: Laugh,
  angry: AngryIcon,
  sad: Frown,
};

const reactionColors = {
  like: 'text-red-500',
  dislike: 'text-gray-500',
  love: 'text-pink-500',
  laugh: 'text-yellow-500',
  angry: 'text-red-600',
  sad: 'text-blue-500',
};

export function ReactionButton({ reactionType, count, isActive, onClick, disabled }: ReactionButtonProps) {
  const Icon = reactionIcons[reactionType];
  const activeColor = reactionColors[reactionType];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-8 px-2 text-xs",
        isActive && activeColor
      )}
    >
      <Icon className={cn("h-4 w-4 mr-1", isActive && "fill-current")} />
      {count > 0 && <span>{count}</span>}
    </Button>
  );
}