"use client";

import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  useCallback,
} from "react";
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
import { FileIcon, LoaderIcon, PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import type { Attachment } from "ai";

interface UserUpload {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
}

function FileUpload() {
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
    [],
  );

  const Attachment = ({ filename }: { filename: string }) => {
    return (
      <div
        key={filename}
        data-testid="input-attachment-preview"
        className="flex flex-col gap-2 relative w-full"
      >
        <div className="w-full bg-muted-foreground/10 rounded-md relative flex flex-row items-center gap-2 p-2">
          <LoaderIcon className="animate-spin text-zinc-500" />
          <span className="text-xs text-zinc-500 max-w-full truncate">
            {filename}
          </span>
        </div>
      </div>
    );
  };

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
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {uploadQueue.map((filename) => (
            <Attachment key={filename} filename={filename} />
          ))}
        </div>
      )}
      <div
        className={cn(
          "relative w-full rounded-lg border border-dashed border-muted-foreground/20",
          "flex flex-row items-center cursor-pointer justify-center h-24",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <PlusIcon className="size-4" />
        <span className="text-sm">Add Files</span>
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
            Select files to add to your vault.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 flex flex-col gap-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            {/* Files */}
            <div className="flex flex-col gap-2 rounded-lg border border-muted-foreground/20 p-2 min-h-24">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))
              ) : uploads.length > 0 ? (
                uploads.map((upload) => (
                  <div key={upload.id} className="flex items-center gap-2">
                    <Checkbox id={upload.id} />
                    <label htmlFor={upload.id} className="text-sm select-none">
                      {upload.filename}
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4 h-full grid place-items-center">
                  No files uploaded yet
                </div>
              )}
            </div>

            {/* Add Files */}
            <FileUpload />
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
