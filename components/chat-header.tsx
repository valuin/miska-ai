"use client";

import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import type { VisibilityType } from "./visibility-selector";
import type { Session } from "next-auth";
import { Download } from "lucide-react";

function PureChatHeader({}: {
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

  const downloadPdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const stepComponents = [
      document.getElementById("step-four-preview"),
      document.getElementById("step-three-preview"),
      document.getElementById("step-two-preview"),
      document.getElementById("step-one-preview"),
    ];

    for (let i = 0; i < stepComponents.length; i++) {
      const component = stepComponents[i];
      if (component) {
        const canvas = await html2canvas(component);
        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }
    }

    pdf.save("financial-report.pdf");
  };

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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="order-2 md:order-1 md:px-2 px-2 md:h-fit"
            onClick={downloadPdf}
          >
            <Download />
            <span className="md:sr-only">Download PDF</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Download PDF</TooltipContent>
      </Tooltip>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
