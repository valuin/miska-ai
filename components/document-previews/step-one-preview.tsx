"use client";
import * as React from "react";
import { TableComponent, SkeletonTables } from "./shared-components";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";

export const StepOnePreview = () => {
  console.log("[StepOnePreview] Mounted");
  const [activeTab, setActiveTab] = React.useState<
    "jurnal" | "buku" | "neraca"
  >("jurnal");
  const { setDocumentPreview } = useDocumentPreviewStore();
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const jurnalData = [
    {
      tanggal: "2025-01-01",
      noAkun: "1101",
      namaAkun: "Kas",
      debit: "10.000.000",
      kredit: "",
      keterangan: "Setoran modal awal",
    },
    {
      tanggal: "2025-01-01",
      noAkun: "3101",
      namaAkun: "Modal",
      debit: "",
      kredit: "10.000.000",
      keterangan: "Setoran modal awal",
    },
  ];
  const bukuData = [
    {
      tanggal: "2025-01-01",
      ref: "001",
      keterangan: "Setoran modal",
      debit: "10.000.000",
      kredit: "",
      saldo: "10.000.000",
    },
    {
      tanggal: "2025-01-05",
      ref: "002",
      keterangan: "Pembelian alat",
      debit: "",
      kredit: "2.000.000",
      saldo: "8.000.000",
    },
  ];
  const neracaData = [
    { noAkun: "1101", namaAkun: "Kas", debit: "8.000.000", kredit: "" },
    { noAkun: "1201", namaAkun: "Peralatan", debit: "2.000.000", kredit: "" },
    { noAkun: "3101", namaAkun: "Modal", debit: "", kredit: "10.000.000" },
  ];

  React.useEffect(() => {
    const data = {
      step: 1,
      jurnalData,
      bukuData,
      neracaData,
    };
    setDocumentPreview(data);
    return () => {
      setDocumentPreview(null);
    };
  }, []);

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
      ) : activeTab === "jurnal" ? (
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
      ) : activeTab === "buku" ? (
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
      ) : (
        <TableComponent
          headers={["No. Akun", "Nama Akun", "Debit", "Kredit"]}
          rows={neracaData.map((d) => [
            d.noAkun,
            d.namaAkun,
            d.debit,
            d.kredit,
          ])}
        />
      )}
    </div>
  );
};
