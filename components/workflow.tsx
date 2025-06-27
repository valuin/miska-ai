import { CheckCircleIcon, InfoIcon } from "lucide-react";
import Task from "./tasks";

export const WorkflowGenerator = ({ result }: { result: any }) => {
  return (
    <div>
      <Task icon={CheckCircleIcon} text="Generating your workflow..." />
    </div>
  );
};

export const ClarificationTool = ({ result }: { result: any }) => {
  return (
    <div>
      <Task icon={InfoIcon} text="Clarifying your workflow details" />
    </div>
  );
};
