"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { WorkflowError } from "@/lib/utils/workflows/workflow";

interface ErrorIndicatorProps {
  errors: WorkflowError[];
}

export function ErrorIndicator({ errors }: ErrorIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (errors.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <AlertCircle className="size-4 mr-1" />
          {errors.length} {errors.length === 1 ? "Error" : "Errors"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Workflow Errors</h4>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div
                key={index}
                className="text-sm text-red-600 bg-red-50 p-2 rounded"
              >
                {error.message}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
