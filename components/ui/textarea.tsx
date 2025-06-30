import { useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"textarea">;

const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, onChange, value, ...props }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync mirrored content when value changes
    useEffect(() => {
      if (wrapperRef.current) {
        wrapperRef.current.dataset.replicatedValue = value?.toString() || "";
      }
    }, [value]);

    return (
      <div
        ref={wrapperRef}
        data-replicated-value={value || ""}
        className="grid grow-wrap"
      >
        <textarea
          className={cn(
            "resize-none overflow-hidden font-inherit leading-relaxed p-2 w-full min-h-[80px] border border-input rounded-md",
            "bg-background text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className,
          )}
          ref={ref}
          value={value}
          onChange={(e) => {
            if (wrapperRef.current) {
              wrapperRef.current.dataset.replicatedValue = e.target.value;
            }
            onChange?.(e);
          }}
          rows={1}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
