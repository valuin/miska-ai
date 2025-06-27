import { Button } from "./ui/button";
import { ArrowDownIcon, CheckCircleIcon, InfoIcon } from "lucide-react";
import { Input } from "./ui/input";
import Task from "./tasks";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useState } from "react";

type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  tool?: string;
  next?: string[];
};

export const WorkflowGenerator = ({
  result,
}: {
  result: { workflow: WorkflowNode[] };
}) => {
  const nodeMap = Object.fromEntries(
    result.workflow.map((node) => [node.id, node]),
  );

  const renderNode = (node: WorkflowNode) => (
    <div
      key={node.id}
      className="relative flex flex-col items-center p-4 rounded-2xl border shadow-md w-full bg-white dark:bg-zinc-900"
    >
      <div className="text-sm uppercase text-muted-foreground font-semibold mb-1">
        {node.type === "human-input" ? "🧍 Human Input" : "🤖 Agent Task"}
      </div>
      <div className="text-base font-medium text-center">
        {node.description}
      </div>
      {node.tool && (
        <div className="text-xs text-muted-foreground mt-1 italic">
          Tool: {node.tool}
        </div>
      )}
    </div>
  );

  const renderWorkflow = (nodeId: string, visited = new Set<string>()) => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodeMap[nodeId];
    if (!node) return null;

    return (
      <div className="flex flex-col items-center gap-4" key={nodeId}>
        {renderNode(node)}
        {node.next?.length ? (
          <>
            <ArrowDownIcon className="size-4 text-muted-foreground" />
            {node.next.map((nextId) => renderWorkflow(nextId, visited))}
          </>
        ) : null}
      </div>
    );
  };

  const rootNode = result.workflow.find(
    (node) => !result.workflow.some((other) => other.next?.includes(node.id)),
  );

  return (
    <div className="flex flex-col gap-6">
      <Task icon={CheckCircleIcon} text="Generating your workflow..." />
      <div className="flex flex-col gap-2 rounded-md border border-border p-4">
        {rootNode ? renderWorkflow(rootNode.id) : <p>No root node found.</p>}
      </div>
    </div>
  );
};

export const ClarificationTool = ({
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
      <Task icon={InfoIcon} text="Clarifying your workflow details" />
      <div className="flex flex-col gap-2 rounded-md border border-border p-4">
        {result.questions.map((question) => (
          <div key={question} className="flex flex-col gap-2">
            <p>{question}</p>
            <Input
              onChange={(e) => {
                setAnswers({ ...answers, [question]: e.target.value });
              }}
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
