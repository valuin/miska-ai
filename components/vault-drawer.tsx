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
import { Skeleton } from "@/components/ui/skeleton";
import { FileIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
      const response = await fetch('/api/vault/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch vault documents');
      }
      const data = await response.json();
      setUploads(data.documents || []);
    } catch (error) {
      console.error('Error fetching vault documents:', error);
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
    <Drawer direction="right" shouldScaleBackground={false} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileIcon className="w-4 h-4" />
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
            <span className="text-sm font-medium text-muted-foreground mb-1">
              Select files to add
            </span>
            <div className="flex flex-col gap-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
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