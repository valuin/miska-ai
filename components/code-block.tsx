"use client";

interface CodeBlockProps {
  node: any;
  block: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  block,
  className,
  children,
  ...props
}: CodeBlockProps) {
  if (block || (typeof children === "string" && children.length > 30)) {
    return (
      <span className="not-prose flex flex-col p-4">
        <span
          {...props}
          className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
        >
          <code className="whitespace-pre-wrap break-words">{children}</code>
        </span>
      </span>
    );
  }

  return (
    <code
      className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
      {...props}
    >
      {children}
    </code>
  );
}
