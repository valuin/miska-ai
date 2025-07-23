'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import {
  Disclosure,
  DisclosureContent,
  DisclosureTrigger,
} from '@/components/ui/disclosure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflow } from '@/hooks/use-workflow';

type HumanInputNotchProps = {
  activeNode: {
    id: string;
    description?: string;
    agent?: string;
    type?: string;
  } | null;
  onClose: () => void;
};

export const HumanInputNotch = ({
  activeNode,
  onClose,
}: HumanInputNotchProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { updateNodeUserInput } = useWorkflow();

  useEffect(() => {
    setIsOpen(!!activeNode);
    if (!activeNode) {
      setInputValue('');
    }
  }, [activeNode]);

  const handleSubmit = () => {
    if (!inputValue.trim() || !activeNode) return;
    updateNodeUserInput(activeNode.id, inputValue); // Use the Zustand action
    setInputValue('');
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose();
    }
  };

  const isEmpty = !inputValue.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Disclosure
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={`w-full rounded-md border border-border bg-background`}
    >
      <DisclosureTrigger className="w-full">
        <div
          className={`p-4 text-center pointer-events-none text-muted-foreground`}
        >
          <p>
            {activeNode
              ? `${activeNode.description}`
              : 'Click a human input node to provide input.'}
          </p>
        </div>
      </DisclosureTrigger>
      <DisclosureContent>
        <div className="overflow-hidden p-4 border-t border-border">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Please provide your response below.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Type your response..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-1 ${isEmpty ? 'border-red-300 focus:ring-red-500' : ''}`}
                autoFocus
                required
              />
              <Button
                onClick={handleSubmit}
                size="icon"
                disabled={!inputValue.trim()}
                variant={isEmpty ? 'destructive' : 'default'}
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
