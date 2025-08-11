"use client";

import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  FileIcon,
  Search,
  SlidersHorizontal,
  Trash2,
  TrashIcon,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { DialogTitle } from "./ui/dialog";

export interface UserUpload {
  id: string;
  filename: string;
  url: string;
  createdAt: string;
  size?: number;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (filename: string) => {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "pdf") {
    return "/images/pdf-file.png";
  }
  if (extension === "xlsx" || extension === "xls" || extension === "csv") {
    return "/images/xls-file.png";
  }

  return "/images/doc-file.png";
};

const groupUploadsByDate = (uploads: UserUpload[]) => {
  const groups: { [key: string]: UserUpload[] } = {
    "Diunggah Hari Ini": [],
    "Diunggah Kemarin": [],
    Lainnya: [],
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  uploads.forEach((upload) => {
    const uploadDate = new Date(upload.createdAt);
    uploadDate.setHours(0, 0, 0, 0);

    if (uploadDate.getTime() === today.getTime()) {
      groups["Diunggah Hari Ini"].push(upload);
    } else if (uploadDate.getTime() === yesterday.getTime()) {
      groups["Diunggah Kemarin"].push(upload);
    } else {
      groups.Lainnya.push(upload);
    }
  });

  return groups;
};

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
        currentUploads.filter((upload) => upload.id !== id)
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

export function VaultDrawer({ width }: { width?: number }) {
  const [uploads, setUploads] = useState<UserUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUploads, setSelectedUploads] = useState<UserUpload[]>([]);

  const fetchUserUploads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/vault/documents");
      if (!response.ok) throw new Error("Gagal mengambil dokumen");
      const data = await response.json();
      setUploads(data.documents || []);
    } catch (error) {
      toast.error("Gagal mengambil dokumen dari arsip.");
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

  const handleDelete = async (id: string) => {
    const response = await fetch("/api/vault/documents", {
      method: "DELETE",
      body: JSON.stringify({ documentId: id }),
    });
    if (response.ok) {
      toast.success("Dokumen berhasil dihapus.");
      setUploads((current) => current.filter((u) => u.id !== id));
      setSelectedUploads((current) => current.filter((u) => u.id !== id));
    } else {
      toast.error("Gagal menghapus dokumen.");
    }
  };

  const handleSelect = (upload: UserUpload, isChecked: boolean) => {
    setSelectedUploads((current) => {
      if (isChecked) {
        return [...current, upload];
      } else {
        return current.filter((u) => u.id !== upload.id);
      }
    });
  };

  const filteredUploads = useMemo(() => {
    return uploads.filter((upload) =>
      upload.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uploads, searchTerm]);

  const groupedUploads = useMemo(
    () => groupUploadsByDate(filteredUploads),
    [filteredUploads]
  );

  return (
    <Drawer direction="right" shouldScaleBackground onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 h-[34px] px-2"
        >
          <FileIcon className="size-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        className="fixed right-0 top-0 h-full w-[95vw] max-w-lg z-50 bg-white flex flex-col p-0"
        style={{ borderRadius: 0, left: "auto" }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Pilih File dari Arsip Dokumen
            </DialogTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <X className="size-5" />
              </Button>
            </DrawerClose>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Centang untuk melanjutkan
          </p>
        </div>

        {/* Search & Filter */}
        <div className="p-6 border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Cari..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <SlidersHorizontal className="mr-2 size-4" />
              Filter
            </Button>
          </div>
        </div>

        <div className="grow overflow-y-auto p-6 space-y-6">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border p-3"
                >
                  <Skeleton className="size-5 rounded-sm" />
                  <Skeleton className="size-8" />
                  <div className="grow space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            : Object.entries(groupedUploads).map(([groupName, groupUploads]) =>
                groupUploads.length > 0 ? (
                  <div key={groupName}>
                    <h3 className="text-sm font-bold text-slate-950 mb-3">
                      {groupName}
                    </h3>
                    <div className="space-y-2">
                      {groupUploads.map((upload) => (
                        <div
                          key={upload.id}
                          className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                        >
                          <Checkbox
                            id={upload.id}
                            onCheckedChange={(checked) =>
                              handleSelect(upload, checked as boolean)
                            }
                            checked={selectedUploads.some(
                              (u) => u.id === upload.id
                            )}
                          />
                          <Image
                            src={getFileIcon(upload.filename)}
                            alt="file type icon"
                            width={32}
                            height={32}
                            className="size-8"
                          />
                          <div className="grow">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {upload.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(upload.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-gray-500 hover:text-red-500"
                            onClick={() => handleDelete(upload.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
        </div>

        {/* Footer Kustom */}
        <div className="p-6 border-gray-200 bg-white mt-auto">
          <div className="flex justify-end gap-4">
            <DrawerClose asChild>
              <Button variant="outline">Kembali</Button>
            </DrawerClose>
            <Button
              className="bg-lime-950 hover:bg-[#04352b] text-white"
              disabled={selectedUploads.length === 0}
              onClick={() => {
                toast.info(`${selectedUploads.length} dokumen dipilih.`);
              }}
            >
              Pilih Dokumen
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
