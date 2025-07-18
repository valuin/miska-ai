import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import type {
  WorkflowDetailsProps,
  NodeOutputProps,
  WorkflowOutputProps,
} from "@/lib/types/workflow";

export function WorkflowDetails({
  workflow,
  inputQuery,
  setInputQuery,
  onRunWorkflow,
  isExecuting,
}: WorkflowDetailsProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Workflow Details</h2>
      <p className="text-lg font-medium">{workflow.name}</p>
      <p className="text-sm text-muted-foreground mb-4">
        {workflow.description || "No description."}
      </p>

      <h3 className="text-lg font-semibold mb-2">Input Query</h3>
      <Input
        placeholder="Enter your query here..."
        value={inputQuery}
        onChange={(e) => setInputQuery(e.target.value)}
        className="mb-4"
      />
      <Button
        onClick={onRunWorkflow}
        className={`w-full ${isExecuting ? "bg-transparent text-white" : ""}`}
        disabled={isExecuting}
      >
        {isExecuting ? (
          <>
            <Spinner size="lg" className="mr-2" />
            Running Workflow
          </>
        ) : (
          <>
            <Play className="mr-2 size-4" />
            Run Workflow
          </>
        )}
      </Button>
    </div>
  );
}

export function NodeOutput({ nodeResults }: NodeOutputProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      {nodeResults.length > 0 ? (
        <>
          <h3 className="text-lg font-semibold mb-2">Node Output</h3>
          {nodeResults.map((result) => (
            <Collapsible key={result.nodeId} className="w-full mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <b className="truncate">{result.description}</b>{" "}
                  <ChevronDown className="size-1" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-2 border border-border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-auto max-h-60">
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {result.output}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            No node outputs available.
          </p>
        </div>
      )}
    </div>
  );
}

export function WorkflowOutput({ nodeResults, workflow }: WorkflowOutputProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      {nodeResults.length > 0 ? (
        workflow?.schema.nodes.length === nodeResults.length && (
          <Collapsible className="w-full mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Workflow Output <ChevronDown className="size-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 p-2 border border-border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-auto max-h-60">
              <pre className="text-sm whitespace-pre-wrap break-all">
                {JSON.stringify(nodeResults, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            No workflow outputs available.
          </p>
        </div>
      )}
    </div>
  );
}
