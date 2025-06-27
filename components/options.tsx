import type { UseChatHelpers } from "@ai-sdk/react";
import { Button } from "./ui/button";

type Option = {
  label: string;
  value: string;
};

export default function Options({
  options,
  append,
}: {
  options: Option[];
  append: UseChatHelpers["append"];
}) {
  return (
    <div className="flex flex-row gap-2 flex-wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
          onClick={() => {
            console.log("clicked", option.value);
            append({ role: "user", content: option.value });
          }}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
