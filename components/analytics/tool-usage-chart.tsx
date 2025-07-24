'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  usage: {
    label: 'Usage',
  },
  'create-document': {
    label: 'Create Document',
    color: 'hsl(210, 100%, 80%)',
  },
  'request-suggestions': {
    label: 'Request Suggestions',
    color: 'hsl(215, 90%, 70%)',
  },
  'update-document': {
    label: 'Update Document',
    color: 'hsl(220, 85%, 60%)',
  },
  'utility-tools': {
    label: 'Utility Tools',
    color: 'hsl(225, 80%, 50%)',
  },
  other: {
    label: 'Other',
    color: 'hsl(230, 75%, 40%)',
  },
} satisfies ChartConfig;

export function ToolUsageChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/tool-usage')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort((a, b) => b.usage - a.usage);
          const blueGradient = [
            'hsl(210, 100%, 80%)',
            'hsl(215, 90%, 70%)',
            'hsl(220, 85%, 60%)',
            'hsl(225, 80%, 50%)',
            'hsl(230, 75%, 40%)',
          ];
          sorted.forEach((item, idx) => {
            item.fill =
              blueGradient[idx] || blueGradient[blueGradient.length - 1];
          });
          setChartData(sorted);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>Tool Usage</CardTitle>
        <CardDescription>Distribution of tools used</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {loading ? (
          <Skeleton className="w-full h-[250px] rounded-md" />
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-pie-label-text]:fill-foreground mt-4 aspect-square w-full max-h-[250px] pb-0"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                layout="vertical"
                margin={{ left: 100 }}
                width={500}
                height={250}
              >
                <YAxis
                  dataKey="tool"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    chartConfig[value as keyof typeof chartConfig]?.label ||
                    value
                  }
                />
                <XAxis dataKey="usage" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="usage"
                  radius={5}
                  isAnimationActive={false}
                  fill="#60a5fa"
                  {...{
                    shape: (props: any) => {
                      const { x, y, width, height, fill, payload } = props;
                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          rx={5}
                          fill={payload.fill}
                        />
                      );
                    },
                  }}
                />
              </BarChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
      <CardFooter className="flex-col text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total tool usage for the last 3 months
        </div>
      </CardFooter>
    </Card>
  );
}
