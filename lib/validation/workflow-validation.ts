import type { Node } from "@xyflow/react";
import type { GenerateTextData } from "@/hooks/workflow/types";

export function validateHumanInputs(
  nodes: Node<GenerateTextData>[],
  nodeUserInputs: Record<string, string>
): { isValid: boolean; errors: { nodeId: string; message: string }[] } {
  const errors: { nodeId: string; message: string }[] = [];
  let isValid = true;

  const humanInputNodes = nodes.filter(
    (node) => node.data.type === "human-input"
  );

  for (const node of humanInputNodes) {
    const userInput = nodeUserInputs[node.id];
    if (!userInput || userInput.trim() === "") {
      const error = {
        nodeId: node.id,
        message: `Input for "${node.data.description}" is required.`,
      };
      errors.push(error);
      isValid = false;
    }
  }

  return { isValid, errors };
}