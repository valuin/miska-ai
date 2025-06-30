import { Button } from "./ui/button";
import { InfoIcon } from "lucide-react";
import Badge from "./badge";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useState } from "react";
import SchemaVisualizer from "./schema-builder";
import { extractWorkflowGraph } from "./schema-graph-util";
import { Textarea } from "./ui/textarea";
import type { CreatedWorkflow } from "@/mastra/tools/workflow-creator-tools";

export const WorkflowMessage = ({ result }: { result: CreatedWorkflow }) => {
  const { name, description } = result;
  const { nodes, edges } = extractWorkflowGraph(result.nodes);
  return (
    <div className="w-full min-h-[400px] min-w-[320px]">
      <h2 className="text-lg font-bold">{name}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      {nodes.length > 0 ? (
        <SchemaVisualizer nodes={nodes} edges={edges} />
      ) : (
        <div className="text-muted-foreground text-sm">No workflow data.</div>
      )}
    </div>
  );
};
export const ClarificationMessage = ({
  result,
  append,
}: {
  result: { questions: string[] };
  append: UseChatHelpers["append"];
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    let content = "";
    for (const question of result.questions) {
      if (answers[question]) {
        content += `- ${question}: ${answers[question]}\n`;
      }
    }
    append({ role: "user", content });
  };

  return (
    <div className="flex flex-col gap-2">
      <Badge icon={InfoIcon} text="Clarifying your workflow details" />
      <div className="flex flex-col gap-2 rounded-md border border-border p-4">
        {result.questions.map((question) => (
          <div key={question} className="flex flex-col gap-2">
            <p>{question}</p>
            <Textarea
              className="min-h-fit"
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
