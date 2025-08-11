"use client";
import * as React from "react";

import { useArtifact } from "@/hooks/use-artifact";
import type { Document } from "@/lib/db/schema";
import { cn, fetcher } from "@/lib/utils";
import equal from "fast-deep-equal";
import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import useSWR from "swr";
import type { ArtifactKind, UIArtifact } from "./artifact";
import { useMessageCountStore } from "./chat-with-preview";
import { CodeEditor } from "./code-editor";
import { DocumentToolCall, DocumentToolResult } from "./document";
import { StepFourPreview } from "./document-previews/step-four-preview";
import { StepOnePreview } from "./document-previews/step-one-preview";
import { StepThreePreview } from "./document-previews/step-three-preview";
import { StepTwoPreview } from "./document-previews/step-two-preview";
import { InlineDocumentSkeleton } from "./document-skeleton";
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from "./icons";
import { ImageEditor } from "./image-editor";
import { SpreadsheetEditor } from "./sheet-editor";
import { Editor } from "./text-editor";

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: any;
  args?: any;
}

const renderPreviewForMessageCount = (count?: number) => {
  if (!count || count < 1) return null;
  if (count === 2) return <StepTwoPreview />;
  if (count === 3) return <StepThreePreview />;
  if (count === 4) return <StepFourPreview />;
  return <StepOnePreview />;
};

const getDerivedDocument = (
  artifact: ReturnType<typeof useArtifact>["artifact"],
  previewDocument: Document | undefined | null
): Document | null => {
  if (previewDocument) return previewDocument;
  if (artifact.status === "streaming") {
    return {
      title: artifact.title,
      kind: artifact.kind,
      content: artifact.content,
      id: artifact.documentId,
      createdAt: new Date(),
      userId: "noop",
    };
  }
  return null;
};

const useSyncBoundingBox = (
  artifact: ReturnType<typeof useArtifact>["artifact"],
  setArtifact: ReturnType<typeof useArtifact>["setArtifact"],
  hitboxRef: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();
    if (artifact.documentId && boundingBox) {
      setArtifact((curr) => ({
        ...curr,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }
  }, [hitboxRef, setArtifact, artifact.documentId]);
};

export function DocumentPreview({
  isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  const { messageCount } = useMessageCountStore();
  const { artifact, setArtifact } = useArtifact();

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Array<Document>
  >(result ? `/api/document?id=${result.id}` : null, fetcher);

  const previewDocument = useMemo(() => documents?.[0], [documents]);
  const hitboxRef = useRef<HTMLDivElement>(null);
  
  // Debugging untuk melihat messageCount
  useEffect(() => {
    console.log("Current message count:", messageCount);
  }, [messageCount]);

  useSyncBoundingBox(artifact, setArtifact, hitboxRef);

  const previewNode = renderPreviewForMessageCount(messageCount);
  if (previewNode) return previewNode;

  if (artifact.isVisible) {
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ id: result.id, title: result.title, kind: result.kind }}
          isReadonly={isReadonly}
        />
      );
    }
    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title }}
          isReadonly={isReadonly}
        />
      );
    }
  }

  if (isDocumentsFetching) {
    const kind: ArtifactKind = (result?.kind ??
      args?.kind ??
      artifact.kind) as ArtifactKind;
    return <LoadingSkeleton artifactKind={kind} />;
  }

  const document = getDerivedDocument(artifact, previewDocument);

  if (!document) {
    return <LoadingSkeleton artifactKind={artifact.kind} />;
  }

  return (
    <DocumentContainer
      hitboxRef={hitboxRef}
      result={result}
      setArtifact={setArtifact}
      title={document.title}
      kind={document.kind}
      isStreaming={artifact.status === "streaming"}
      document={document}
    />
  );
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full">
    <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700 border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>
    {artifactKind === "image" ? (
      <div className="overflow-y-scroll border rounded-b-2xl bg-muted border-t-0 dark:border-zinc-700">
        <div className="animate-pulse h-[257px] bg-muted-foreground/20 w-full" />
      </div>
    ) : (
      <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

const PureHitboxLayer = ({
  hitboxRef,
  result,
  setArtifact,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  result: any;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)
  ) => void;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();

      setArtifact((artifact) =>
        artifact.status === "streaming"
          ? { ...artifact, isVisible: true }
          : {
              ...artifact,
              title: result.title,
              documentId: result.id,
              kind: result.kind,
              isVisible: true,
              boundingBox: {
                left: boundingBox.x,
                top: boundingBox.y,
                width: boundingBox.width,
                height: boundingBox.height,
              },
            }
      );
    },
    [setArtifact, result]
  );

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl z-10"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (!equal(prevProps.result, nextProps.result)) return false;
  return true;
});

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
}) => (
  <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
    <div className="flex flex-row items-start sm:items-center gap-3">
      <div className="text-muted-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : kind === "image" ? (
          <ImageIcon />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;

  return true;
});

const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact } = useArtifact();

  const containerClassName = cn(
    "h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700",
    {
      "p-4 sm:p-8": document.kind === "text",
      "p-0": document.kind === "code",
    }
  );

  const commonProps = {
    content: document.content ?? "",
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: artifact.status,
    saveContent: () => {},
    suggestions: [],
  };

  return (
    <div className={containerClassName}>
      {document.kind === "text" ? (
        <Editor {...commonProps} onSaveContent={() => {}} />
      ) : document.kind === "code" ? (
        <div className="flex flex-1 relative w-full">
          <div className="absolute inset-0">
            <CodeEditor {...commonProps} onSaveContent={() => {}} />
          </div>
        </div>
      ) : document.kind === "sheet" ? (
        <div className="flex flex-1 relative size-full p-4">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === "image" ? (
        <ImageEditor
          title={document.title}
          content={document.content ?? ""}
          isCurrentVersion={true}
          currentVersionIndex={0}
          status={artifact.status}
          isInline={true}
        />
      ) : null}
    </div>
  );
};

const DocumentContainer = ({
  hitboxRef,
  result,
  setArtifact,
  title,
  kind,
  isStreaming,
  document,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  result: any;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)
  ) => void;
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
  document: Document;
}) => {
  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer
        hitboxRef={hitboxRef}
        result={result}
        setArtifact={setArtifact}
      />
      <DocumentHeader title={title} kind={kind} isStreaming={isStreaming} />
      <DocumentContent document={document} />
    </div>
  );
};
