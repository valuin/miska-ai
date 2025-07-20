"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from '@/components/ui/disclosure';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type HumanInputNotchProps = {
  activeNode: { id: string; description: string } | null;
  onSubmit: (value: string) => void;
  onClose: () => void;
};

export const HumanInputNotch = ({ activeNode, onSubmit, onClose }: HumanInputNotchProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(!!activeNode);
    if (!activeNode) {
      setInputValue("");
    }
  }, [activeNode]);

  const handleSubmit = () => {
    if (!inputValue.trim() || !activeNode) return;
    onSubmit(inputValue);
    setInputValue("");
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose();
    }
  };

  return (
    <Disclosure
      open={isOpen}
      onOpenChange={handleOpenChange}
      className='w-full rounded-md border border-border bg-background'
    >
      <DisclosureTrigger className="w-full">
        <div className='p-4 text-center text-muted-foreground'>
          <p>{activeNode ? `${activeNode.description}` : "Click a human input node to provide input."}</p>
        </div>
      </DisclosureTrigger>
      <DisclosureContent>
        <div className='overflow-hidden p-4 border-t border-border'>
          <div className='space-y-2'>
            <p className="text-xs text-muted-foreground">
              Please provide your response below.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Type your response..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={handleSubmit}
                size="icon"
                disabled={!inputValue.trim()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </DisclosureContent>
    </Disclosure>
  );
};