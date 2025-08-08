"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, File, UploadCloud } from "lucide-react";
import type { Session } from "next-auth";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { SetupData } from "./profile-setup";

interface FileUploadBoxProps {
  title: string;
  onFileUpload: (file: File) => Promise<void>;
  initialFileName?: string | null;
  initialIsCompleted?: boolean;
}

function FileUploadBox({
  title,
  onFileUpload,
  initialFileName = null,
  initialIsCompleted = false,
}: FileUploadBoxProps) {
  const [fileName, setFileName] = useState<string | null>(initialFileName);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFileName(file.name);
    try {
      await onFileUpload(file);
      setIsCompleted(true);
      toast.success(`${file.name} berhasil diunggah.`);
    } catch (error) {
      toast.error(`Gagal mengunggah ${file.name}.`);
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-3 text-gray-800">{title}</h3>
      <div
        className="relative flex flex-col items-center justify-center w-full p-6 text-center border-2 border-dashed border-gray-300 rounded-lg"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current!.files = dt.files;
            handleFileSelect({ target: fileInputRef.current! } as any);
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading || isCompleted}
        />

        {isCompleted ? (
          <div className="flex flex-col items-center text-green-600 space-y-2">
            <CheckCircle2 className="size-10" />
            <p className="text-sm font-medium">Berhasil Diunggah</p>
            <p className="text-xs text-gray-500 truncate max-w-full">
              {fileName}
            </p>
          </div>
        ) : (
          <>
            <UploadCloud className="size-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">
              Seret & lepas file Anda di sini, atau klik untuk memilih file dari
              komputer Anda.
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-4 bg-[#054135] hover:bg-[#04352b] text-white"
            >
              {isUploading ? "Mengunggah..." : "Unggah"}
              {!isUploading && <File className="ml-2 size-4" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface Step3FileUploadProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
  session: Session;
}

export function Step3FileUpload({
  data,
  onUpdate,
  session,
}: Step3FileUploadProps) {
  // Daftar dokumen yang diperlukan
  const requiredDocuments = [
    "Chart of Accounts (COA)",
    "Daftar Pemasok",
    "Daftar Aset Tetap",
    "Daftar Barang & Jasa",
    "Daftar Pelanggan",
  ];

  // Fungsi upload generik yang akan dipanggil oleh setiap FileUploadBox
  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/files/upload-blob", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const uploadResult = await uploadResponse.json();

      const processResponse = await fetch("/api/files/process-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileUrl: uploadResult.url,
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!processResponse.ok) {
        throw new Error(`Failed to process ${file.name}`);
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
        onUpdate({
          uploadedFiles: [
            ...(data.uploadedFiles || []),
            {
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified,
            },
          ],
        });
        toast.success(`${file.name} berhasil diupload ke vault`);
      } else {
        throw new Error(`Failed to save ${file.name} to vault`);
      }
    } catch (error) {
      toast.error(`Gagal mengupload ${file.name}`);
      console.error("Upload error:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Grid untuk semua kotak upload file */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
        {requiredDocuments.map((docTitle) => {
          const uploadedFile = data.uploadedFiles?.find(
            (f) => f.name === docTitle
          );
          return (
            <FileUploadBox
              key={docTitle}
              title={docTitle}
              onFileUpload={handleFileUpload}
              initialFileName={uploadedFile?.name || null}
              initialIsCompleted={!!uploadedFile}
            />
          );
        })}
      </div>
    </div>
  );
}
