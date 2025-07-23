import React from 'react';
import Badge from './badge';

interface ToolCallBadgeProps {
  icon: React.ElementType;
  query: string;
}

export default function ToolCallBadge({
  icon: Icon,
  query,
}: ToolCallBadgeProps) {
  return (
    <Badge
      icon={() => <Icon className="size-4" />}
      text={
        <p className="whitespace-nowrap flex flex-row gap-1">
          Searched{' '}
          <code className="text-muted-foreground/80 font-semibold">
            {query}
          </code>
        </p>
      }
    />
  );
}
