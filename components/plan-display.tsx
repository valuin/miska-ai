"use client";

import { CheckSquare, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Todo {
  title: string;
  description: string;
}

interface PlanDisplayProps {
  data: {
    todos: Todo[];
  };
}

export function PlanDisplay({ data }: PlanDisplayProps) {
  if (!data || !data.todos) {
    return null;
  }

  const { todos } = data;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        I have created a plan to assist you:
      </h3>
      {todos.map((todo, index) => (
        <Collapsible
          key={index}
          className="bg-muted/20 border-l-4 border-primary rounded-lg"
        >
          <CollapsibleTrigger className="w-full">
            <Card className="bg-transparent border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center space-x-3">
                  <CheckSquare className="size-5 text-primary" />
                  <CardTitle className="text-base font-medium">
                    {todo.title}
                  </CardTitle>
                </div>
                <ChevronDown className="size-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {todo.description}
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
