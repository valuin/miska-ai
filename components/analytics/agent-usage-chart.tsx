"use client";

import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A pie chart with no separator";

const chartData = [
  { agent: "researchAgent", usage: 275, fill: "hsl(210, 100%, 80%)" },
  { agent: "ragChatAgent", usage: 200, fill: "hsl(215, 90%, 70%)" },
  { agent: "workflowCreatorAgent", usage: 187, fill: "hsl(220, 85%, 60%)" },
  { agent: "documentAgent", usage: 173, fill: "hsl(225, 80%, 50%)" },
  { agent: "normalAgent", usage: 90, fill: "hsl(230, 75%, 40%)" },
  { agent: "communicationAgent", usage: 50, fill: "hsl(235, 70%, 30%)" },
];

const chartConfig = {
  usage: {
    label: "Usage",
  },
  researchAgent: {
    label: "Research Agent",
    color: "hsl(210, 100%, 80%)",
  },
  ragChatAgent: {
    label: "RAG Chat Agent",
    color: "hsl(215, 90%, 70%)",
  },
  workflowCreatorAgent: {
    label: "Workflow Creator Agent",
    color: "hsl(220, 85%, 60%)",
  },
  documentAgent: {
    label: "Document Agent",
    color: "hsl(225, 80%, 50%)",
  },
  normalAgent: {
    label: "Normal Agent",
    color: "hsl(230, 75%, 40%)",
  },
} satisfies ChartConfig;

export function AgentUsageChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>Agent Usage</CardTitle>
        <CardDescription>Distribution of agent types used</CardDescription>
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
              nameKey="agent"
              stroke="0"
              label
            />
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {chartData.map((item) => (
            <div key={item.agent} className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs">
                {chartConfig[item.agent as keyof typeof chartConfig]?.label ||
                  item.agent}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col mt-4 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing total agent usage for the last 3 months
        </div>
      </CardFooter>
    </Card>
  );
}
