"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  ChartConfig,
} from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"

const chartData = [
  { date: "2024-04-01", messages: 222 },
  { date: "2024-04-02", messages: 97 },
  { date: "2024-04-03", messages: 167 },
  { date: "2024-04-04", messages: 242 },
  { date: "2024-04-05", messages: 373 },
  { date: "2024-04-06", messages: 301 },
  { date: "2024-04-07", messages: 245 },
  { date: "2024-04-08", messages: 409 },
  { date: "2024-04-09", messages: 59 },
  { date: "2024-04-10", messages: 261 },
  { date: "2024-04-11", messages: 327 },
  { date: "2024-04-12", messages: 292 },
  { date: "2024-04-13", messages: 342 },
  { date: "2024-04-14", messages: 137 },
  { date: "2024-04-15", messages: 120 },
  { date: "2024-04-16", messages: 138 },
  { date: "2024-04-17", messages: 446 },
  { date: "2024-04-18", messages: 364 },
  { date: "2024-04-19", messages: 243 },
  { date: "2024-04-20", messages: 89 },
  { date: "2024-04-21", messages: 137 },
  { date: "2024-04-22", messages: 224 },
  { date: "2024-04-23", messages: 138 },
  { date: "2024-04-24", messages: 387 },
  { date: "2024-04-25", messages: 215 },
  { date: "2024-04-26", messages: 75 },
  { date: "2024-04-27", messages: 383 },
  { date: "2024-04-28", messages: 122 },
  { date: "2024-04-29", messages: 315 },
  { date: "2024-04-30", messages: 454 },
  { date: "2024-05-01", messages: 165 },
  { date: "2024-05-02", messages: 293 },
  { date: "2024-05-03", messages: 247 },
  { date: "2024-05-04", messages: 385 },
  { date: "2024-05-05", messages: 481 },
  { date: "2024-05-06", messages: 498 },
  { date: "2024-05-07", messages: 388 },
  { date: "2024-05-08", messages: 149 },
  { date: "2024-05-09", messages: 227 },
  { date: "2024-05-10", messages: 293 },
  { date: "2024-05-11", messages: 335 },
  { date: "2024-05-12", messages: 197 },
  { date: "2024-05-13", messages: 197 },
  { date: "2024-05-14", messages: 448 },
  { date: "2024-05-15", messages: 473 },
  { date: "2024-05-16", messages: 338 },
  { date: "2024-05-17", messages: 499 },
  { date: "2024-05-18", messages: 315 },
  { date: "2024-05-19", messages: 235 },
  { date: "2024-05-20", messages: 177 },
  { date: "2024-05-21", messages: 82 },
  { date: "2024-05-22", messages: 81 },
  { date: "2024-05-23", messages: 252 },
  { date: "2024-05-24", messages: 294 },
  { date: "2024-05-25", messages: 201 },
  { date: "2024-05-26", messages: 213 },
  { date: "2024-05-27", messages: 420 },
  { date: "2024-05-28", messages: 233 },
  { date: "2024-05-29", messages: 78 },
  { date: "2024-05-30", messages: 340 },
  { date: "2024-05-31", messages: 178 },
  { date: "2024-06-01", messages: 178 },
  { date: "2024-06-02", messages: 470 },
  { date: "2024-06-03", messages: 103 },
  { date: "2024-06-04", messages: 439 },
  { date: "2024-06-05", messages: 88 },
  { date: "2024-06-06", messages: 294 },
  { date: "2024-06-07", messages: 323 },
  { date: "2024-06-08", messages: 385 },
  { date: "2024-06-09", messages: 438 },
  { date: "2024-06-10", messages: 155 },
  { date: "2024-06-11", messages: 92 },
  { date: "2024-06-12", messages: 492 },
  { date: "2024-06-13", messages: 81 },
  { date: "2024-06-14", messages: 426 },
  { date: "2024-06-15", messages: 307 },
  { date: "2024-06-16", messages: 371 },
  { date: "2024-06-17", messages: 475 },
  { date: "2024-06-18", messages: 107 },
  { date: "2024-06-19", messages: 341 },
  { date: "2024-06-20", messages: 408 },
  { date: "2024-06-21", messages: 169 },
  { date: "2024-06-22", messages: 317 },
  { date: "2024-06-23", messages: 480 },
  { date: "2024-06-24", messages: 132 },
  { date: "2024-06-25", messages: 141 },
  { date: "2024-06-26", messages: 434 },
  { date: "2024-06-27", messages: 448 },
  { date: "2024-06-28", messages: 149 },
  { date: "2024-06-29", messages: 103 },
  { date: "2024-06-30", messages: 446 },
]

const chartConfig = {
  messages: {
    label: "Messages",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ChartBarInteractive() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Interactions</CardTitle>
        <CardDescription>
          Showing total messages for the last 3 months
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
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey="messages" fill="var(--color-messages)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}