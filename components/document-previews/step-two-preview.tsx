"use client";
import * as React from "react";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { useFinancials } from "./financials-context";
import { TableComponent, SkeletonTables } from "./shared-components";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { CardPersediaan } from "../analytics/card-persediaan";

import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { PreviewMessage } from "../message";

interface StepTwoPreviewProps {
  chatId?: string;
  messages?: Array<UIMessage>;
  setMessages?: UseChatHelpers["setMessages"];
  reload?: UseChatHelpers["reload"];
  append?: UseChatHelpers["append"];
}

export const StepTwoPreview = ({
  chatId,
  messages,
  setMessages,
  reload,
  append,
}: StepTwoPreviewProps) => {
  const [activeTab, setActiveTab] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { documentPreview } = useDocumentPreviewStore();
  const { workbookId, chatId: contextChatId } = useFinancials();
  const [availableTabs, setAvailableTabs] = React.useState<string[]>([]);
  const [tableData, setTableData] = React.useState<Record<string, any>>({});
  const [dataLoaded, setDataLoaded] = React.useState(false);

  const parseAndSetTableData = React.useCallback((previewData: any) => {
    console.log("📝 Processing preview data:", previewData);
    if (!previewData || !previewData.content) {
      setLoading(false);
      setDataLoaded(false);
      return;
    }

    const { content } = previewData;
    const newTableData: Record<string, any> = {};
    const newAvailableTabs: string[] = [];

    const dataMapping = [
      { key: "perhitunganPersediaan", name: "Perhitungan Persediaan" },
      { key: "penyusutanAsetData", name: "Penyusutan Aset" },
      { key: "jurnalPenyesuaianData", name: "Jurnal Penyesuaian" },
      { key: "rekonsiliasiBankData", name: "Rekonsiliasi Bank" },
    ];

    dataMapping.forEach(({ key, name }) => {
      if (content[key]) {
        newTableData[name] = content[key];
        newAvailableTabs.push(name);
      }
    });

    setTableData(newTableData);
    setAvailableTabs(newAvailableTabs);

    if (newAvailableTabs.length > 0) {
      setActiveTab(newAvailableTabs[0] || null);
      setDataLoaded(true);
    } else {
      setDataLoaded(false);
    }

    setLoading(false);
  }, []);

  const fetchFinancialData = async (workbookId: string, chatId: string) => {
    console.log(
      `🚀 Memulai fetch untuk workbookId: ${workbookId} dan chatId: ${chatId}`
    );
    setLoading(true);
    try {
      const response = await fetch(
        `/api/financials/${workbookId}?chatId=${chatId}`
      );

      console.log("✅ Response status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📊 Data yang diterima dari API:", data);

      if (data) {
        parseAndSetTableData({ content: data });
      }
    } catch (error) {
      console.error("❌ Error fetching financial data:", error);
      setDataLoaded(false);
    } finally {
      setLoading(false);
      console.log("🏁 Proses fetch selesai.");
    }
  };

  React.useEffect(() => {
    if (workbookId && contextChatId) {
      fetchFinancialData(workbookId, contextChatId);
    } else if (documentPreview) {
      parseAndSetTableData(documentPreview);
    } else {
      setLoading(false);
      setDataLoaded(false);
    }
  }, [workbookId, contextChatId, documentPreview, parseAndSetTableData]);

  return (
    <div className="w-full">
      {/* Tombol untuk testing fetch */}
      {/* AI Chat Response Preview */}
      {messages && messages.length > 0 && (
        <div className="mb-4">
          <PreviewMessage
            chatId={chatId ?? ""}
            message={messages[messages.length - 1]}
            isLoading={false}
            vote={undefined}
            setMessages={setMessages ?? (() => {})}
            reload={reload ?? (async () => null)}
            isReadonly={true}
            requiresScrollPadding={false}
            append={append ?? (async () => null)}
          />
        </div>
      )}
      <div className="flex border-b mb-4 overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 whitespace-nowrap ${
              activeTab === tab ? "border-b-2 border-primary" : ""
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? (
        <SkeletonTables />
      ) : !dataLoaded ? (
        <div className="p-4 text-center">
          <p className="text-gray-500">
            Tidak ada data yang tersedia untuk langkah ini.
          </p>
        </div>
      ) : (
        <>
          {activeTab === "Perhitungan Persediaan" &&
            tableData["Perhitungan Persediaan"] && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <CardPersediaan
                    imageUrl="/images/persediaan-awal.svg"
                    title="Nilai Persediaan Awal"
                    amount={
                      tableData["Perhitungan Persediaan"]?.summary
                        ?.nilaiPersediaanAwal ?? "N/A"
                    }
                    description="Nilai awal persediaan"
                  />
                  <CardPersediaan
                    imageUrl="/images/total-pembelian.svg"
                    title="Total Pembelian"
                    amount={
                      tableData["Perhitungan Persediaan"]?.summary
                        ?.totalPembelian ?? "N/A"
                    }
                    description="Total pembelian persediaan"
                  />
                  <CardPersediaan
                    imageUrl="/images/hpp.svg"
                    title="HPP"
                    amount={
                      tableData["Perhitungan Persediaan"]?.summary?.hpp ?? "N/A"
                    }
                    description="Harga Pokok Penjualan"
                  />
                  <CardPersediaan
                    imageUrl="/images/persediaan-akhir.svg"
                    title="Nilai Persediaan Akhir"
                    amount={
                      tableData["Perhitungan Persediaan"]?.summary
                        ?.nilaiPersediaanAkhir ?? "N/A"
                    }
                    description="Nilai akhir persediaan"
                  />
                </div>
                <TableComponent
                  headers={[
                    "Tanggal",
                    "Keterangan",
                    "Masuk (Unit)",
                    "Masuk (Harga)",
                    "Masuk (Total)",
                    "Keluar (Unit)",
                    "Keluar (Harga)",
                    "Keluar (Total)",
                    "Saldo (Unit)",
                    "Saldo (Harga)",
                    "Saldo (Total)",
                  ]}
                  rows={
                    tableData["Perhitungan Persediaan"]?.kartuPersediaan?.map(
                      (item: any) => [
                        item.tanggal,
                        item.keterangan,
                        item.masukUnit ?? "",
                        item.masukHarga ?? "",
                        item.masukTotal ?? "",
                        item.keluarUnit ?? "",
                        item.keluarHarga ?? "",
                        item.keluarTotal ?? "",
                        item.saldoUnit,
                        item.saldoHarga,
                        item.saldoTotal,
                      ]
                    ) ?? []
                  }
                />
                <h2 className="text-xl font-bold mt-4">Jurnal Penyesuaian</h2>
                <TableComponent
                  headers={["Debit", "Kredit"]}
                  rows={[
                    [
                      tableData["Perhitungan Persediaan"]?.jurnalPenyesuaian
                        ?.debit ?? "N/A",
                      tableData["Perhitungan Persediaan"]?.jurnalPenyesuaian
                        ?.kredit ?? "N/A",
                    ],
                  ]}
                />
              </div>
            )}
          {activeTab === "Penyusutan Aset" && tableData["Penyusutan Aset"] && (
            <TableComponent
              headers={[
                "Nama Aset",
                "Tgl Perolehan",
                "Harga Perolehan",
                "Nilai Residu",
                "Masa Manfaat",
                "Metode",
                "Penyusutan Tahunan",
                "Akumulasi Penyusutan",
                "Nilai Buku",
              ]}
              rows={tableData["Penyusutan Aset"].map((e: any) => [
                e.namaAset,
                e.tanggalPerolehan,
                e.hargaPerolehan,
                e.nilaiResidu,
                e.masaManfaat,
                e.metodePenyusutan,
                e.penyusutanTahunan,
                e.akumulasiPenyusutan,
                e.nilaiBuku,
              ])}
            />
          )}
          {activeTab === "Jurnal Penyesuaian" &&
            tableData["Jurnal Penyesuaian"] && (
              <TableComponent
                headers={[
                  "Tanggal",
                  "No Akun",
                  "Nama Akun",
                  "Debit",
                  "Kredit",
                  "Keterangan",
                  "Jenis Adjustment",
                ]}
                rows={tableData["Jurnal Penyesuaian"].map((e: any) => [
                  e.tanggal,
                  e.noAkun,
                  e.namaAkun,
                  e.debit,
                  e.kredit,
                  e.keterangan,
                  e.jenisAdjustment,
                ])}
              />
            )}
          {activeTab === "Rekonsiliasi Bank" &&
            tableData["Rekonsiliasi Bank"] && (
              <TableComponent
                headers={[
                  "Bulan",
                  "Saldo Buku Bank",
                  "Saldo Buku Perusahaan",
                  "Saldo Setelah Rekonsiliasi",
                  "Selisih",
                ]}
                rows={tableData["Rekonsiliasi Bank"].map((e: any) => [
                  e.bulan,
                  e.saldoBukuBank,
                  e.saldoBukuPerusahaan,
                  e.saldoSetelahRekonsiliasi,
                  e.selisih,
                ])}
              />
            )}
        </>
      )}
    </div>
  );
};
