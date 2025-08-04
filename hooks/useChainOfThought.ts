import { useState, useCallback } from 'react';

interface UseChainOfThoughtReturn {
  question: string;
  setQuestion: (question: string) => void;
  response: string;
  finalAnswer: string; // New state for final answer
  loading: boolean;
  error: string | null;
  askQuestion: () => Promise<void>;
  clearResponse: () => void;
}

export const useChainOfThought = (): UseChainOfThoughtReturn => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [finalAnswer, setFinalAnswer] = useState(''); // Initialize final answer state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(async () => {
    console.log("useChainOfThought - askQuestion called with:", question);
    if (!question.trim()) {
      console.log("Question is empty, not calling API.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse('');
    setFinalAnswer(''); // Clear final answer on new question

    try {
      const res = await fetch('/api/chain-of-thought-stream', { // Changed to streaming endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const errorText = await res.text(); // Read as text for streaming errors
        console.error("API Error Response (streaming):", errorText);
        throw new Error(errorText || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      let extractedFinalAnswer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        setResponse(accumulatedResponse);

        // Attempt to extract final answer from the accumulated response
        const finalAnswerMatch = accumulatedResponse.match(/Final Answer:\s*(.*)/i);
        if (finalAnswerMatch && finalAnswerMatch[1]) {
          extractedFinalAnswer = finalAnswerMatch[1].trim();
          setFinalAnswer(extractedFinalAnswer);
        }
      }

    } catch (err) {
      console.error("useChainOfThought - Error during fetch:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [question]);

  const clearResponse = useCallback(() => {
    setResponse('');
    setFinalAnswer('');
    setError(null);
  }, []);

  return {
    question,
    setQuestion,
    response,
    finalAnswer,
    loading,
    error,
    askQuestion,
    clearResponse,
  };
};