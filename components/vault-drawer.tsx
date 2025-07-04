"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { FileIcon, LoaderIcon, PlusIcon, TrashIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import type { Attachment } from "ai";

function VaultUploadingList({ uploads }: { uploads: Attachment[] }) {
  return (
    <div className="flex flex-row gap-2 overflow-x-scroll items-end mb-2">
      {uploads.map((upload, index) => (
        <div
          key={`${upload.name}-${index}`}
          data-testid="input-attachment-preview"
          className="flex flex-col gap-2 relative w-full"
        >
          <div className="w-full bg-muted-foreground/10 rounded-md relative flex flex-row items-center gap-2 p-2">
            <FileIcon className="size-4" />
            <LoaderIcon className="animate-spin text-zinc-500" />
            <span className="text-xs text-zinc-500 max-w-full truncate">
              {upload.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface UserUpload {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

export function VaultList({
  uploads,
  setUploads,
  isLoading,
  isDeletable,
  isSelectable,
  onSendToAgent,
}: {
  uploads: UserUpload[];
  setUploads?: Dispatch<SetStateAction<UserUpload[]>>;
  isLoading: boolean;
  isDeletable?: boolean;
  isSelectable?: boolean;
  onSendToAgent?: (uploads: UserUpload[]) => void;
}) {
  const [selectedUploads, setSelectedUploads] = useState<UserUpload[]>([]);

  const handleDelete = async (id: string) => {
    if (!isDeletable || !setUploads) return;
    const response = await fetch("/api/vault/documents", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documentId: id }),
    });

    if (response.ok) {
      toast.success("Document deleted from vault");
      setUploads((currentUploads) =>
        currentUploads.filter((upload) => upload.id !== id),
      );
    } else {
      toast.error("Failed to delete document from vault");
    }
  };

  const handleSelect = (upload: UserUpload, checked: boolean) => {
    if (checked) {
      setSelectedUploads([...selectedUploads, upload]);
    } else {
      setSelectedUploads(selectedUploads.filter((u) => u.id !== upload.id));
    }
  };

  const handleSendToAgent = () => {
    onSendToAgent?.(selectedUploads);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-muted-foreground/20 p-4 mb-8 max-h-96">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))
      ) : uploads.length > 0 ? (
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-2 flex-1">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center gap-2">
                {isSelectable && (
                  <Checkbox
                    id={upload.id}
                    checked={selectedUploads.includes(upload)}
                    onCheckedChange={(checked) =>
                      handleSelect(upload, checked as boolean)
                    }
                  />
                )}
                <label
                  htmlFor={upload.id}
                  className="text-sm select-none truncate break-all"
                >
                  {upload.filename}
                </label>
                {isDeletable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto p-2 size-6"
                    onClick={() => handleDelete(upload.id)}
                  >
                    <TrashIcon className="size-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {onSendToAgent && (
            <div className="flex mt-4 flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="ml-auto w-full"
                onClick={() => handleSendToAgent()}
              >
                Send documents to Agent
                <span className="text-xs text-muted-foreground mt-px">
                  {selectedUploads.length} files selected
                </span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-4 h-full grid place-items-center">
          No files uploaded yet
        </div>
      )}
    </div>
  );
}

function FileUpload({ fetchUserUploads }: { fetchUserUploads: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/files/upload-blob",
        multipart: true,
      });

      const processResponse = await fetch("/api/files/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: newBlob.url,
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!processResponse.ok) {
        throw new Error("Failed to process document");
      }

      const processResult = await processResponse.json();

      const saveResponse = await fetch("/api/vault/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tempDocumentId: processResult.document.id,
        }),
      });

      if (saveResponse.ok) {
        toast.success("Document saved to vault successfully!");
        fetchUserUploads();
      } else {
        toast.error("Failed to save document to vault");
      }

      return {
        url: newBlob.url,
        name: file.name,
        contentType: file.type,
      };
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to process file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));

        // clear the input
        event.target.value = "";
        event.target.files = null;

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="w-full">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <VaultUploadingList uploads={attachments} />
      )}
      <div
        className={cn(
          "relative w-full rounded-lg border border-dashed border-muted-foreground/20",
          "flex flex-row gap-2 items-center cursor-pointer justify-center h-24",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <PlusIcon className="size-4" />
        <span className="text-sm">Upload files to your vault</span>
      </div>
    </div>
  );
}

export function VaultDrawer() {
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUserUploads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/vault/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch vault documents");
      }
      const data = await response.json();
      setUploads(data.documents || []);
    } catch (error) {
      console.error("Error fetching vault documents:", error);
      setUploads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserUploads();
    }
  }, [isOpen]);

  return (
    <Drawer
      direction="right"
      shouldScaleBackground={false}
      onOpenChange={setIsOpen}
    >
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 h-[34px] px-2"
        >
          <FileIcon className="size-4" />
          Open Vault
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        className="fixed right-0 top-0 h-full w-[90vw] pl-4 pt-4 max-w-sm z-50 bg-background border-l flex flex-col"
        style={{ borderRadius: 0, left: "auto" }}
      >
        <DrawerHeader>
          <DrawerTitle>Document Vault</DrawerTitle>
          <DrawerDescription>
            These files will be accessible to your agents.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-2 flex-1">
            {/* Files */}
            <div className="flex-1 min-h-0">
              <div className="rounded-lg border border-muted-foreground/20 bg-background max-h-96 overflow-y-auto">
                <VaultList
                  uploads={uploads}
                  setUploads={setUploads}
                  isLoading={isLoading}
                  isSelectable={false}
                  isDeletable={true}
                />
              </div>
            </div>
            {/* Add Files */}
            <div className="pt-2">
              <FileUpload fetchUserUploads={fetchUserUploads} />
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="secondary" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
