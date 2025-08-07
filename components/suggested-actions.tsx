"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { memo } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
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
      title: "💰 Generate Laporan Keuangan",
      label: "Laporan laba rugi, neraca, dan arus kas",
      action:
        "Saya ingin membuat laporan keuangan 3 bulan terakhir untuk usaha saya. Tolong bantu saya membuat laporan laba rugi, neraca, dan arus kas dengan visualisasi data.",
    },
    {
      title: "📊 Analisis Pajak & SPT",
      label: "Validasi NPWP dan generate SPT PPN",
      action:
        "Saya perlu bantuan untuk menganalisis data transaksi, validasi NPWP lawan transaksi, dan generate SPT PPN beserta faktur pajak dan bukti potong.",
    },
    {
      title: "🔍 Audit & Compliance",
      label: "Evaluasi internal control dan risk assessment",
      action:
        "Saya ingin melakukan audit internal untuk mengevaluasi sistem pengendalian internal, risk assessment, dan memastikan compliance dengan standar akuntansi.",
    },
    {
      title: "🤖 Super Agent Assistant",
      label: "AI yang bisa mengatur semua agent",
      action:
        "Saya ingin menggunakan Super Agent yang bisa membantu saya dengan berbagai tugas keuangan dan mengarahkan ke agent yang tepat sesuai kebutuhan.",
    },
  ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, "", `/chat/${chatId}`);

              append({
                role: "user",
                content: suggestedAction.action,
              });

              // Call the callback to close sidebar
              onActionClick?.();
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
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
