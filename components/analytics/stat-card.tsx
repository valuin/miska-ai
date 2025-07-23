'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendDirection,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex p-6">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          <div className="mt-1 flex items-center gap-1">
            {trend && trendDirection && (
              <span
                className={`flex items-center text-xs font-medium ${
                  trendDirection === 'up' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {trendDirection === 'up' ? (
                  <TrendingUp className="mr-1 size-3" />
                ) : (
                  <TrendingDown className="mr-1 size-3" />
                )}
                {trend}
              </span>
            )}
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        </div>
        <div className="flex size-12 items-center justify-center rounded-md bg-gray-950">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
