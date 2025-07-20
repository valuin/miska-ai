import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function DefaultToolResult({
  toolName,
  result,
}: {
  toolName: string;
  result: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="text-sm text-gray-500 rounded-lg flex items-center gap-2 w-fit"
        onClick={() => setIsOpen(!isOpen)}
      >
        Used {toolName} <ChevronDown className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="text-sm text-gray-500">
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
