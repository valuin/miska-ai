"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, UploadIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "next-auth";
import type { SetupData } from "./profile-setup";

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
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRequiredFiles = () => {
    const files = [];

    if (data.services.accounting) {
      files.push("Mutasi Rekening Koran bulan lalu");
      if (data.hasChartOfAccounts) {
        files.push("Daftar Akun (Chart of Accounts)");
      }
    }

    if (data.services.tax) {
      if (data.pkpStatus === "pkp") {
        files.push("Faktur Penjualan (Pajak Keluaran) bulan lalu");
        files.push("Faktur Pembelian (Pajak Masukan) bulan lalu");
      }
    }

    if (data.services.accounting || data.services.audit) {
      files.push("Daftar Aset Tetap (jika ada pembelian baru)");
    }

    return files;
  };

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Upload to blob storage
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

        // Process document
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

        // Save to vault
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
          setUploadedFiles((prev) => [...prev, file.name]);
          toast.success(`${file.name} berhasil diupload ke vault`);
        } else {
          throw new Error(`Failed to save ${file.name} to vault`);
        }
      }
    } catch (error) {
      toast.error("Gagal mengupload file");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const requiredFiles = getRequiredFiles();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Upload Dokumen Pendukung</h3>
        <p className="text-gray-600 mb-6">
          Berdasarkan pilihan layanan Anda, berikut adalah dokumen yang
          diperlukan:
        </p>
      </div>

      {/* Required Files List */}
      <div className="space-y-4">
        <h4 className="font-medium">Dokumen yang Diperlukan:</h4>
        {requiredFiles.map((file, index) => (
          <Card key={index} className="border-l-4 border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileIcon className="w-4 h-4" />
                {file}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Upload file dalam format PDF, Excel, atau CSV
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400" />
          <div>
            <Label className="text-lg font-medium">Upload Dokumen</Label>
            <p className="text-sm text-gray-600 mt-1">
              Drag and drop file atau klik untuk memilih
            </p>
          </div>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? "Mengupload..." : "Pilih File"}
          </Button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">File yang Sudah Diupload:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((fileName, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
              >
                <CheckIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm">{fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Files */}
      <div className="space-y-4">
        <h4 className="font-medium">Dokumen Tambahan (Opsional):</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dokumen Legal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                SIUP, TDP, atau dokumen legal lainnya
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dokumen Pajak</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                SPT tahunan sebelumnya, bukti potong pajak
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Laporan Keuangan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Laporan keuangan periode sebelumnya
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Dokumen Lainnya</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Dokumen pendukung lainnya yang relevan
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Tips Upload:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pastikan file dalam format PDF, Excel, atau CSV</li>
          <li>• File akan otomatis disimpan ke vault dan dapat diakses AI</li>
          <li>• Upload dapat dilakukan kembali nanti di menu Vault</li>
          <li>
            • AI akan menggunakan dokumen ini untuk analisis yang lebih akurat
          </li>
        </ul>
      </div>
    </div>
  );
}
