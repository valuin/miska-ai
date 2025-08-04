"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useChainOfThought } from "@/hooks/useChainOfThought";

interface ChainOfThoughtProps {
  isVisible: boolean; // Keep isVisible for now, though it might be redundant if always true when rendered
  question: string;
}

export function ChainOfThought({ question }: ChainOfThoughtProps) {
  const { response, loading, error, askQuestion, clearResponse, setQuestion } =
    useChainOfThought();

  useEffect(() => {
    console.log("ChainOfThought useEffect - question:", question);
    if (question) {
      setQuestion(question); // Set the question in the hook
      console.log("Calling askQuestion with:", question);
      askQuestion(); // Trigger the chain of thought generation
    } else {
      clearResponse(); // Clear response if question is empty
    }
  }, [question, askQuestion, clearResponse, setQuestion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md mt-4"
    >
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
        Chain of Thought
      </h3>

      {loading && (
        <div className="flex items-center space-x-2 text-blue-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating chain of thought...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Error: {error}
        </div>
      )}

      {response && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
          {response}
        </div>
      )}

      {!loading && !error && !response && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No chain of thought generated yet.
        </p>
      )}
    </motion.div>
  );
}
