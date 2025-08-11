"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { BrainCircuit, File, Lightbulb, Scale } from "lucide-react";
import { memo } from "react";
import { GradientIcon } from "./chat-history-grid";
import { Button } from "./ui/button";
import type { VisibilityType } from "./visibility-selector";

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers["append"];
  selectedVisibilityType: VisibilityType;
  onActionClick?: () => void;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
  onActionClick,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: (
        <span className="flex items-center gap-1.5">
          Generate Laporan Keuangan
        </span>
      ),
      icon: (
        <div className="rounded-full p-4 bg-lime-50 flex items-center justify-center">
          <GradientIcon Icon={File} size={20} />
        </div>
      ),
      label: "Laporan laba rugi, neraca, dan arus kas",
      action:
        "Saya ingin membuat laporan keuangan 3 bulan terakhir untuk usaha saya. Tolong bantu saya membuat laporan laba rugi, neraca, dan arus kas dengan visualisasi data.",
    },
    {
      title: (
        <span className="flex items-center gap-1.5">Analisis Pajak & SPT</span>
      ),
      icon: (
        <div className="rounded-full p-4 bg-lime-50 flex items-center justify-center">
          <GradientIcon Icon={Lightbulb} size={20} />
        </div>
      ),
      label: "Validasi NPWP dan generate SPT PPN",
      action:
        "Saya perlu bantuan untuk menganalisis data transaksi, validasi NPWP lawan transaksi, dan generate SPT PPN beserta faktur pajak dan bukti potong.",
    },
    {
      title: (
        <span className="flex items-center gap-1.5">Audit & Compliance</span>
      ),
      icon: (
        <div className="rounded-full p-4 bg-lime-50 flex items-center justify-center">
          <GradientIcon Icon={Scale} size={20} />
        </div>
      ),
      label: "Evaluasi internal control dan risk assessment",
      action:
        "Saya ingin melakukan audit internal untuk mengevaluasi sistem pengendalian internal, risk assessment, dan memastikan compliance dengan standar akuntansi.",
    },
    {
      title: (
        <span className="flex items-center gap-1.5">Super Agent Assistant</span>
      ),
      icon: (
        <div className="rounded-full p-4 bg-lime-50 flex items-center justify-center">
          <GradientIcon Icon={BrainCircuit} size={20} />
        </div>
      ),
      label: "AI yang bisa mengatur semua agent",
      action:
        "Saya ingin menggunakan Super Agent yang bisa membantu saya dengan berbagai tugas keuangan dan mengarahkan ke agent yang tepat sesuai kebutuhan.",
    },
  ];

  const limitedActions = suggestedActions.slice(0, 3);

  return (
    <div data-testid="suggested-actions" className="flex flex-row gap-3 w-full">
      {limitedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className="flex-1"
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
                content: suggestedAction.action,
              });

              onActionClick?.();
            }}
            className="text-left border rounded-xl p-6 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-md shadow-[#A6E564]/30"
          >
            {suggestedAction.icon}
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  }
);
