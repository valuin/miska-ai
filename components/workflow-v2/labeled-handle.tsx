'use client';

import { cn } from '@/lib/utils';
import type { HandleProps } from '@xyflow/react';
import React from 'react';

import { BaseHandle } from '@/components/workflow-v2/base-handle';

const flexDirections = {
  top: 'flex-col',
  right: 'flex-row-reverse justify-end',
  bottom: 'flex-col-reverse justify-end',
  left: 'flex-row',
};

const transformDirections = {
  top: '-translate-y-1/2',
  right: '-translate-x-1/2',
  bottom: 'translate-y-1/2',
  left: 'translate-x-1/2',
};

const LabeledHandle = React.forwardRef<
  HTMLDivElement,
  HandleProps &
    React.HTMLAttributes<HTMLDivElement> & {
      title: string;
      handleClassName?: string;
      labelClassName?: string;
    }
>(
  (
    { className, labelClassName, handleClassName, title, position, ...props },
    ref,
  ) => (
    <div
      ref={ref}
      title={title}
      className={cn(
        'relative flex items-center',
        flexDirections[position],
        transformDirections[position],
        className,
      )}
    >
      <BaseHandle position={position} className={handleClassName} {...props} />
      {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
      <label
        className={cn(
          'px-3 border border-foreground bg-background text-foreground text-xs rounded-full',
          labelClassName,
        )}
      >
        {title}
      </label>
    </div>
  ),
);

LabeledHandle.displayName = 'LabeledHandle';

export { LabeledHandle };
