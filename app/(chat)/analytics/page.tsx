import { ChartBarInteractive } from "@/components/analytics/bar-chart";
import { AgentUsageChart } from "@/components/analytics/agent-usage-chart";
import { StatCard } from "@/components/analytics/stat-card";
import { ToolUsageChart } from "@/components/analytics/tool-usage-chart";
import { MessageCircle, Clock, Zap } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Messages"
          value="1,234"
          subtitle="in the last 7 days"
          icon={<MessageCircle className="size-6 text-white" />}
        />
        <StatCard
          title="Average Time Spent"
          value="2m 34s"
          subtitle="in chat"
          icon={<Clock className="size-6 text-white" />}
        />
        <StatCard
          title="Projected Time Savings"
          value="12 hours"
          subtitle="this month"
          icon={<Zap className="size-6 text-white" />}
        />
      </div>
      <ChartBarInteractive />
      <div className="grid grid-cols-2 gap-4">
        <AgentUsageChart />
        <ToolUsageChart />
      </div>
      <div className="">
        <StatCard
          title="AI Summary"
          value="Agents optimized workflows"
          subtitle="AI agents handled 80% of repetitive tasks, reducing manual effort and increasing response speed. Usage metrics show a 12% boost in efficiency and higher user satisfaction."
          icon={<Zap className="size-6 text-white" />}
        />
      </div>
    </div>
  );
}
