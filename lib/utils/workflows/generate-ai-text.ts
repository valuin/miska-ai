import type { GenerateTextNode } from "@/components/flow/generate-text-node";
import type { Model } from "@/components/ui/model-selector";
import { generateText } from "ai";
import { z } from "zod";
import { myProvider } from "@/lib/ai/providers";

interface ToolResult {
	id: string;
	name: string;
	result: string;
}

function createAIClient(model: Model) {
	const modelMap: Record<Model, string> = {
		"gpt-4o": "chat-model",
		"gpt-4o-mini": "title-model",
		"deepseek-chat": "chat-model",
		"llama-3.3-70b-versatile": "chat-model",
		"llama-3.1-8b-instant": "title-model",
		"deepseek-r1-distill-llama-70b": "chat-model",
	};

	const mappedModel = modelMap[model];
	if (!mappedModel) {
		throw new Error(`Unsupported model: ${model}`);
	}

	return myProvider.languageModel(mappedModel);
}

function mapToolsForAI(
	tools: GenerateTextNode["data"]["dynamicHandles"]["tools"],
) {
	return Object.fromEntries(
		tools.map((toolToMap) => [
			toolToMap.name,
			{
				description: toolToMap.description,
				parameters: z.object({
					toolValue: z.string(),
				}),
				execute: async ({ toolValue }: { toolValue: string }) => toolValue,
			},
		]),
	);
}

export async function generateAIText({
	prompt,
	system,
	model,
	tools,
}: {
	prompt: string;
	system?: string;
	model: Model;
	tools: GenerateTextNode["data"]["dynamicHandles"]["tools"];
}) {
	const modelInstance = createAIClient(model);
	const mappedTools = mapToolsForAI(tools);

	const result = await generateText({
		model: modelInstance,
		system,
		prompt,
		...(tools.length > 0 && {
			tools: mappedTools,
			maxSteps: 1,
			toolChoice: "required",
		}),
	});

	let toolResults: ToolResult[] = [];
	if (tools.length > 0 && result.toolResults) {
		toolResults = result.toolResults.map((step) => {
			const originalTool = tools.find((tool) => tool.name === step.toolName);
			return {
				id: originalTool?.id || "",
				name: step.toolName,
				description: originalTool?.description || "",
				result: step.result,
			};
		});
	}

	const parsedResult: Record<string, string> = {
		result: result.text,
	};

	for (const toolResult of toolResults) {
		parsedResult[toolResult.id] = toolResult.result;
	}

	return {
		text: result.text,
		toolResults,
		totalTokens: result.usage?.totalTokens,
		parsedResult,
	};
}
