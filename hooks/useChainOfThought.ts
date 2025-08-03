import { useState, useCallback } from 'react';

interface UseChainOfThoughtReturn {
  question: string;
  setQuestion: (question: string) => void;
  response: string;
  loading: boolean;
  error: string | null;
  askQuestion: () => Promise<void>;
  clearResponse: () => void;
}

export const useChainOfThought = (): UseChainOfThoughtReturn => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      const res = await fetch('/api/chain-of-thought', { // Changed to non-streaming endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json(); // Expecting JSON response now
      setResponse(data.chainOfThought + "\n\nFinal Answer: " + data.finalAnswer); // Combine for display
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [question]);

  const clearResponse = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return {
    question,
    setQuestion,
    response,
    loading,
    error,
    askQuestion,
    clearResponse,
  };
};