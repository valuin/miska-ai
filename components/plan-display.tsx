"use client";

import { CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
      <h3 className="text-lg font-semibold">I have created a plan to assist you:</h3>
      {todos.map((todo, index) => (
        <Card key={index} className="bg-muted/20 border-l-4 border-primary">
          <CardHeader className="flex flex-row items-center space-x-3 pb-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-medium">{todo.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{todo.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}