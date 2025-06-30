"use client";

import { useState, useEffect } from "react";
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
import { FileIcon, PlusIcon } from "lucide-react";
import { FileUploadSection } from "./multimodal-input";
import { Skeleton } from "@/components/ui/skeleton";

interface UserUpload {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
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
            <div className="flex flex-col gap-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-24" />
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
                <div className="text-sm text-muted-foreground text-center py-4">
                  No files uploaded yet
                </div>
              )}
            </div>

            <div className="w-full">
              <FileUploadSection triggerClassName="w-full">
                <div
                  className={cn(
                    "relative w-full rounded-lg border border-dashed border-muted-foreground/20",
                    "flex flex-row items-center cursor-pointer justify-center h-24",
                  )}
                >
                  <PlusIcon className="size-4" />
                  <span className="text-sm">Add Files</span>
                </div>
              </FileUploadSection>
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
