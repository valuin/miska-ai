"use client"

import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

export const description = "A pie chart with no separator"

const chartData = [
  { tool: "create-document", usage: 275, fill: "hsl(210, 100%, 80%)" },
  { tool: "request-suggestions", usage: 200, fill: "hsl(215, 90%, 70%)" },
  { tool: "update-document", usage: 187, fill: "hsl(220, 85%, 60%)" },
  { tool: "utility-tools", usage: 173, fill: "hsl(225, 80%, 50%)" },
  { tool: "other", usage: 90, fill: "hsl(230, 75%, 40%)" },
]

const chartConfig = {
  usage: {
    label: "Usage",
  },
  "create-document": {
    label: "Create Document",
    color: "hsl(210, 100%, 80%)",
  },
  "request-suggestions": {
    label: "Request Suggestions",
    color: "hsl(215, 90%, 70%)",
  },
  "update-document": {
    label: "Update Document",
    color: "hsl(220, 85%, 60%)",
  },
  "utility-tools": {
    label: "Utility Tools",
    color: "hsl(225, 80%, 50%)",
  },
  other: {
    label: "Other",
    color: "hsl(230, 75%, 40%)",
  },
} satisfies ChartConfig

export function ToolUsageChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>Tool Usage</CardTitle>
        <CardDescription>Distribution of tools used</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="usage"
              nameKey="tool"
              stroke="0"
              label
            />
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {chartData.map((item) => (
            <div key={item.tool} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs">
                {
                  chartConfig[item.tool as keyof typeof chartConfig]?.label ||
                  item.tool
                }
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total tool usage for the last 3 months
        </div>
      </CardFooter>
    </Card>
  )
}