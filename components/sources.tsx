/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ChevronDownIcon } from "./icons";
import { LightbulbIcon, SearchIcon } from "lucide-react";
import Task from "./tasks";

type SearchResult = {
  url: string;
  title: string;
  content: string;
  thumbnail: string;
  engine: string;
  img_src: string;
  priority: string;
  score: number;
  category: string;
  publishedDate: string | null;
};

type SearchResponse = {
  query: string;
  results: SearchResult[];
  suggestions: string[];
};

export default function Sources({
  args,
  streaming,
}: {
  args: SearchResponse;
  streaming: boolean;
}) {
  const { query, results, suggestions } = args;
  const [open, setOpen] = useState(streaming);

  useEffect(() => {
    if (!streaming) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [streaming]);

  if (!results || results.length === 0) {
    return (
      <Task icon={<SearchIcon className="size-4" />} text="Searching..." />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Task
        icon={<SearchIcon className="size-4" />}
        text={
          <p className="whitespace-nowrap flex flex-row gap-1">
            Searched{" "}
            <code className="text-muted-foreground/80 font-semibold">
              {query}
            </code>
          </p>
        }
      />
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full px-3 py-2 border rounded bg-muted/50 hover:bg-muted-foreground/20 gap-2"
          >
            <span className="flex items-center gap-2">
              <LightbulbIcon className="size-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground font-medium">
                {results.length} Source{results.length !== 1 ? "s" : ""} Found
              </span>
            </span>
            <div
              className="size-4 transition-transform"
              style={{
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ChevronDownIcon />
            </div>
          </button>
        </DropdownMenuTrigger>
        <div
          style={{ maxHeight: open ? "300px" : "0px" }}
          className="overflow-y-auto !pt-0"
        >
          {results.map((result) => (
            <div key={result.url} className="hover:bg-muted-foreground/20 px-3">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground p-1"
              >
                {result.img_src && (
                  <img
                    src={result.img_src}
                    alt="icon"
                    className="size-5 rounded-full object-cover"
                  />
                )}
                <span className="truncate">{result.title}</span>
              </a>
            </div>
          ))}
        </div>
      </DropdownMenu>
    </div>
  );
}
