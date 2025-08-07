"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";

interface AgentCardsProps {
  onAgentSelect: (agentType: string) => void;
  selectedAgent?: string | null;
}

export function AgentCards({ onAgentSelect, selectedAgent }: AgentCardsProps) {
  const agents = [
    {
      id: "accountingAgent",
      name: "Accounting Agent",
      icon: "💰",
      color: "border-blue-500 bg-blue-50",
      selectedColor: "border-blue-600 bg-blue-100 ring-2 ring-blue-200",
    },
    {
      id: "taxAgent",
      name: "Tax Agent",
      icon: "📊",
      color: "border-green-500 bg-green-50",
      selectedColor: "border-green-600 bg-green-100 ring-2 ring-green-200",
    },
    {
      id: "auditAgent",
      name: "Audit Agent",
      icon: "🔍",
      color: "border-purple-500 bg-purple-50",
      selectedColor: "border-purple-600 bg-purple-100 ring-2 ring-purple-200",
    },
  ];

  // Persist selected agent to localStorage
  useEffect(() => {
    if (selectedAgent) {
      localStorage.setItem("selectedAgent", selectedAgent);
    }
  }, [selectedAgent]);

  return (
    <div className="flex justify-center gap-6">
      {agents.map((agent) => {
        const isSelected = selectedAgent === agent.id;
        return (
          <div
            key={agent.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 rounded-full flex flex-col items-center justify-center ${
              isSelected ? agent.selectedColor : agent.color
            } w-24 h-24 border-2`}
            onClick={() => onAgentSelect(agent.id)}
          >
            <div className="text-2xl mb-1">{agent.icon}</div>
            <div className="text-xs text-black font-medium text-center px-2">
              {agent.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
