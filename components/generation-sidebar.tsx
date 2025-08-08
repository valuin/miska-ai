"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GenerationSidebarProps {
  isVisible: boolean;
  isWide?: boolean;
  filePreview?: {
    url: string;
    filename: string;
    type: string;
  };
  ragResults?: Array<{
    text: string;
    filename: string;
    score: number;
  }>;
}

export function GenerationSidebar({
  isVisible,
  isWide = false,
  filePreview,
  ragResults,
}: GenerationSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsOpen(true);
    } else {
      const timer = setTimeout(() => setIsOpen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed right-0 top-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 ${
            isWide ? "w-1/3" : "w-80"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Generation Details
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Additional information...
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {filePreview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      File Preview
                    </h4>
                    <Button variant="outline" size="sm">
                      Download PDF
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileIcon className="w-4 h-4" />
                      <span className="font-medium">
                        {filePreview.filename}
                      </span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Preview content will be displayed here...
                      </p>
                    </div>
                  </div>
                </div>
              ) : ragResults && ragResults.length > 0 ? (
                // RAG Results Mode
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      RAG Results
                    </h4>
                    <Button variant="outline" size="sm">
                      Download PDF
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {ragResults.map((result, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">
                            {result.filename}
                          </span>
                          <span className="text-xs text-gray-500">
                            Score: {result.score.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {result.text}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      No additional details available
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This sidebar displays file previews or RAG results.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>AI Generation</span>
                <span className="flex items-center space-x-1">
                  <Bot className="w-4 h-4" />
                  <span>Powered by AI</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
