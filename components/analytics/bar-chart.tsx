'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

export const description = 'An interactive bar chart';

import { useEffect, useState } from 'react';

const chartConfig = {
  messages: {
    label: 'Messages',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function ChartBarInteractive() {
  const [chartData, setChartData] = useState<
    { date: string; messages: number }[]
  >([]);
  const [messageCount, setMessageCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/analytics/message-count-by-date')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data)) {
          setChartData(data);
          // Calculate total messages from grouped data
          setMessageCount(data.reduce((sum, d) => sum + (d.messages ?? 0), 0));
        }
      })
      .catch(() => {
        setChartData([]);
        setMessageCount(null);
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Interactions</CardTitle>
        <CardDescription>
          {messageCount !== null
            ? `Total messages: ${messageCount}`
            : 'Showing total messages for the last 3 months'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar dataKey="messages" fill="var(--color-messages)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
