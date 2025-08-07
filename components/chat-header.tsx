"use client";

import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";

import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { type VisibilityType } from "./visibility-selector";
import type { Session } from "next-auth";
import { PanelRightOpen, PanelRightClose } from "lucide-react";

import { VaultDrawer } from "./vault-drawer";

function PureChatHeader({
  isReadonly,
  onToggleGenerationSidebar,
  isGenerationSidebarVisible,
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  onToggleGenerationSidebar: () => void;
  isGenerationSidebarVisible: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <div className="order-1 md:order-4">
          <VaultDrawer />
        </div>
      )}

      <div className="order-1 md:order-5 ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleGenerationSidebar}
            >
              {isGenerationSidebarVisible ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isGenerationSidebarVisible
              ? "Hide Generation Sidebar"
              : "Show Generation Sidebar"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
