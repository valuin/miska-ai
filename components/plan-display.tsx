"use client";

import Image from "next/image";
import { CheckCircle, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Todo {
  title: string;
  description: string;
  files?: {
    name: string;
    size: string;
    type: "pdf" | "xls" | "doc";
  }[];
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

      <Accordion type="single" collapsible className="w-full">
        {todos.map((todo, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="rounded-xl overflow-hidden border-gray-300 border mb-4"
          >
            <AccordionTrigger className="group w-full bg-[#054135] p-0 [&>svg]:hidden">
              <div className="text-white flex items-center justify-between px-6 py-4 rounded-t-xl w-full relative">
                <div className="flex items-center space-x-3 z-10">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{todo.title}</span>
                    <div className="flex">
                      <CheckCircle className="size-5 text-white" />
                      <span className="text-xs opacity-80 ml-2">
                        {todo.description}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0">
                  <Image
                    src="/images/collapsible-coin.png"
                    alt="Coin"
                    width={150}
                    height={250}
                    className="object-contain"
                  />
                </div>
                <div className="absolute top-4 right-6 z-10">
                  <ChevronDown className="size-5 text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="bg-white">
              <CardContent className="p-4 border-t border-gray-300">
                <p className="text-sm text-muted-foreground mb-4">
                  {todo.description}
                </p>

                {todo.files && todo.files.length > 0 && (
                  <div className="mt-4">
                    {todo.files.map((file, fileIndex) => (
                      <Card
                        key={fileIndex}
                        className="bg-slate-100 flex items-center p-3 mb-2"
                      >
                        <Image
                          src={`/images/${file.type}-file.png`}
                          alt={file.type}
                          width={40}
                          height={40}
                          className="mr-3"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {file.size}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
