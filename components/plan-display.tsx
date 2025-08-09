"use client";

import Image from "next/image";
import { CheckCircle, ChevronDown } from "lucide-react";
import { CardContent } from "@/components/ui/card";
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
        <Collapsible key={index} className="rounded-xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="bg-[#054135] text-white flex items-center justify-between p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{todo.title}</span>
                  <div className="flex">
                    <CheckCircle className="size-5 text-white" />
                    <span className="text-xs opacity-80">
                      {todo.description}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Image
                  src="/images/collapsible-coin.png"
                  alt="Coin"
                  width={100}
                  height={200}
                  className="mt-6"
                />
                <ChevronDown className="size-6 transition-transform text-white data-[state=open]:rotate-180" />
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="bg-muted/20 p-4">
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
