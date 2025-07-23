'use client';

import { EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';

export type StatusEdge = EdgeProps & {
  data: {
    status?: 'idle' | 'running' | 'completed' | 'error' | undefined;
  };
};

export function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: StatusEdge) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status || 'idle';

  const getStatusColors = () => {
    switch (status) {
      case 'error':
        return {
          start: '#dc2626',
          mid: '#ef4444',
          end: '#dc2626',
          bg: 'bg-red-500',
          text: 'text-white',
        };
      case 'running':
        return {
          start: '#ea580c',
          mid: '#f97316',
          end: '#ea580c',
          bg: 'bg-orange-500',
          text: 'text-white',
        };
      case 'completed':
        return {
          start: '#16a34a',
          mid: '#22c55e',
          end: '#16a34a',
          bg: 'bg-green-500',
          text: 'text-white',
        };
      default: // idle
        return {
          start: '#6b7280',
          mid: '#9ca3af',
          end: '#6b7280',
          bg: 'bg-gray-500',
          text: 'text-white',
        };
    }
  };

  const colors = getStatusColors();

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.start} />
          <stop offset="25%" stopColor={colors.mid} />
          <stop offset="50%" stopColor={colors.mid} />
          <stop offset="75%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.end} />
        </linearGradient>

        <linearGradient
          id={`horizontal-gradient-${id}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor={colors.start} />
          <stop offset="50%" stopColor={colors.mid} />
          <stop offset="100%" stopColor={colors.end} />
        </linearGradient>

        <pattern
          id={`pipes-${id}`}
          patternUnits="userSpaceOnUse"
          width="60"
          height="10"
        >
          <rect
            width="60"
            height="3"
            fill={`url(#horizontal-gradient-${id})`}
          />
          <rect
            y="1.5"
            width="60"
            height="3"
            fill={`url(#horizontal-gradient-${id})`}
            opacity="0.8"
          />
          <rect
            y="3"
            width="60"
            height="3"
            fill={`url(#horizontal-gradient-${id})`}
            opacity="0.6"
          />
        </pattern>

        {status === 'running' && (
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <path
        d={edgePath}
        fill="none"
        stroke={`url(#pipes-${id})`}
        strokeWidth={45}
        strokeLinecap="butt"
        strokeLinejoin="round"
        filter={status === 'running' ? `none` : 'none'}
        className={cn(
          status === 'running' && 'animate-pulse',
          status === 'completed' && 'opacity-80',
        )}
        style={{
          animationDuration: status === 'running' ? '1.5s' : undefined,
        }}
      />

      {status !== 'idle' && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'absolute px-2 py-1 text-xs font-medium rounded-md pointer-events-none',
              'transform -translate-x-1/2 -translate-y-1/2',
              colors.bg,
              colors.text,
            )}
            style={{
              left: labelX,
              top: labelY,
            }}
          >
            {status === 'error' && 'Error'}
            {status === 'running' && 'Running'}
            {status === 'completed' && 'Completed'}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
