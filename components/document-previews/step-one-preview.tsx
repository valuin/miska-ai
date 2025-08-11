"use client";
import { useEffect, useState } from "react";
import { TableComponent, SkeletonTables } from "./shared-components";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";

export const StepOnePreview = () => {
  console.log("[StepOnePreview] Mounted");
  const [activeTab, setActiveTab] = useState<"jurnal" | "buku" | "neraca">(
    "jurnal"
  );
  const { setDocumentPreview } = useDocumentPreviewStore();
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const [jurnalData, setJurnalData] = useState<any[]>([]);
  const [bukuData, setBukuData] = useState<any[]>([]);
  const [neracaData, setNeracaData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = useDocumentPreviewStore.subscribe((state) => {
      console.log("Document preview state changed:", state.documentPreview);

      if (state.documentPreview) {
        let hasData = false;

        if (
          state.documentPreview.jurnalData &&
          state.documentPreview.jurnalData.length > 0
        ) {
          console.log("Setting jurnal data from direct props");
          setJurnalData(state.documentPreview.jurnalData);
          hasData = true;
        }

        if (
          state.documentPreview.bukuData &&
          state.documentPreview.bukuData.length > 0
        ) {
          console.log("Setting buku data from direct props");
          setBukuData(state.documentPreview.bukuData);
          hasData = true;
        }

        if (
          state.documentPreview.neracaData &&
          state.documentPreview.neracaData.length > 0
        ) {
          console.log("Setting neraca data from direct props");
          setNeracaData(state.documentPreview.neracaData);
          hasData = true;
        }

        if (state.documentPreview.content) {
          try {
            console.log("Parsing content from string");

            const parsedContent = JSON.parse(state.documentPreview.content);

            if (
              parsedContent.jurnalData &&
              parsedContent.jurnalData.length > 0
            ) {
              console.log("Setting jurnal data from parsed content");
              setJurnalData(parsedContent.jurnalData);
              hasData = true;
            }

            if (parsedContent.bukuData && parsedContent.bukuData.length > 0) {
              console.log("Setting buku data from parsed content");
              setBukuData(parsedContent.bukuData);
              hasData = true;
            }

            if (
              parsedContent.neracaData &&
              parsedContent.neracaData.length > 0
            ) {
              console.log("Setting neraca data from parsed content");
              setNeracaData(parsedContent.neracaData);
              hasData = true;
            }
          } catch (error) {
            console.error(
              "Error parsing content from accounting-tools.ts:",
              error
            );
          }
        }

        if (state.documentPreview.metadata) {
          console.log("Setting metadata");
          setMetadata(state.documentPreview.metadata);
        }

        if (hasData) {
          setDataLoaded(true);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      setDocumentPreview(null);
    };
  }, [setDocumentPreview]);

  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab("jurnal")}
          className={`px-4 py-2 ${activeTab === "jurnal" ? "border-b-2 border-primary" : ""}`}
        >
          Jurnal Umum
        </button>
        <button
          onClick={() => setActiveTab("buku")}
          className={`px-4 py-2 ${activeTab === "buku" ? "border-b-2 border-primary" : ""}`}
        >
          Buku Besar
        </button>
        <button
          onClick={() => setActiveTab("neraca")}
          className={`px-4 py-2 ${activeTab === "neraca" ? "border-b-2 border-primary" : ""}`}
        >
          Neraca Saldo
        </button>
      </div>

      {loading ? (
        <SkeletonTables />
      ) : !dataLoaded ? (
        <div className="p-4 text-center">
          <p className="text-gray-500">
            Tidak ada data yang tersedia. Silakan unggah dokumen keuangan ke
            vault dan gunakan queryVaultDocumentsTool untuk mengambil data.
          </p>
        </div>
      ) : activeTab === "jurnal" && jurnalData.length > 0 ? (
        <TableComponent
          headers={[
            "Tanggal",
            "No. Akun",
            "Nama Akun",
            "Debit",
            "Kredit",
            "Keterangan",
          ]}
          rows={jurnalData.map((d) => [
            d.tanggal,
            d.noAkun,
            d.namaAkun,
            d.debit,
            d.kredit,
            d.keterangan,
          ])}
        />
      ) : activeTab === "jurnal" ? (
        <div className="p-4 text-center">
          <p className="text-gray-500">
            Tidak ada data jurnal umum yang tersedia dari vault.
          </p>
        </div>
      ) : activeTab === "buku" && bukuData.length > 0 ? (
        <TableComponent
          headers={[
            "Tanggal",
            "No. Referensi",
            "Keterangan",
            "Debit",
            "Kredit",
            "Saldo",
          ]}
          rows={bukuData.map((d) => [
            d.tanggal,
            d.ref,
            d.keterangan,
            d.debit,
            d.kredit,
            d.saldo,
          ])}
        />
      ) : activeTab === "buku" ? (
        <div className="p-4 text-center">
          <p className="text-gray-500">
            Tidak ada data buku besar yang tersedia dari vault.
          </p>
        </div>
      ) : neracaData.length > 0 ? (
        <TableComponent
          headers={["No. Akun", "Nama Akun", "Debit", "Kredit"]}
          rows={neracaData.map((d) => [
            d.noAkun,
            d.namaAkun,
            d.debit,
            d.kredit,
          ])}
        />
      ) : (
        <div className="p-4 text-center">
          <p className="text-gray-500">
            Tidak ada data neraca saldo yang tersedia dari vault.
          </p>
        </div>
      )}
    </div>
  );
};
