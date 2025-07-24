import { Button } from './ui/button';
import { InfoIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { useState } from 'react';
import Badge from './badge';
import type { UseChatHelpers } from '@ai-sdk/react';

export const ClarificationMessage = ({
  result,
  append,
}: {
  result: { questions: string[] };
  append: UseChatHelpers['append'];
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    let content = '';
    for (const question of result.questions) {
      if (answers[question]) {
        content += `- ${question}: ${answers[question]}\n`;
      }
    }
    append({ role: 'user', content });
  };

  return (
    <div className="flex flex-col gap-2">
      <Badge icon={InfoIcon} text="Clarifying your workflow details" />
      <div className="flex flex-col gap-2 rounded-md border border-border p-4">
        {result.questions.map((question) => (
          <div key={question} className="flex flex-col gap-2">
            <p>{question}</p>
            <Textarea
              className="min-h-0"
              onChange={(e) =>
                setAnswers({ ...answers, [question]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
      <Button
        disabled={Object.values(answers).length === 0}
        onClick={handleSubmit}
      >
        Submit answers
      </Button>
    </div>
  );
};
