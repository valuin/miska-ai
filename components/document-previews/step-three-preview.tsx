"use client";
import * as React from "react";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { useFinancials } from "./financials-context";
import { TableComponent, SkeletonTables } from "./shared-components";

import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { PreviewMessage } from "../message";
import { Button } from "../ui/button";

interface StepThreePreviewProps {
  chatId?: string;
  messages?: Array<UIMessage>;
  setMessages?: UseChatHelpers["setMessages"];
  reload?: UseChatHelpers["reload"];
  append?: UseChatHelpers["append"];
}

export const StepThreePreview = ({
  chatId,
  messages,
  setMessages,
  reload,
  append,
}: StepThreePreviewProps) => {
  const [activeTab, setActiveTab] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { documentPreview } = useDocumentPreviewStore();
  const { workbookId, chatId: contextChatId } = useFinancials();
  const [availableTabs, setAvailableTabs] = React.useState<string[]>([]);
  const [tableData, setTableData] = React.useState<Record<string, any>>({});
  const [dataLoaded, setDataLoaded] = React.useState(false);

  const parseAndSetTableData = React.useCallback((previewData: any) => {
    if (!previewData) {
      setLoading(false);
      setDataLoaded(false);
      return;
    }

    const content = previewData.content || previewData;
    const newTableData: Record<string, any> = {};
    const newAvailableTabs: string[] = [];

    const dataMapping = [
      { key: "laba_Rugi", name: "Laporan Laba Rugi" },
      { key: "perubahanEkuitas", name: "Laporan Perubahan Ekuitas" },
      { key: "posisiKeuangan", name: "Laporan Posisi Keuangan" },
      { key: "arusKas", name: "Laporan Arus Kas" },
    ];

    dataMapping.forEach(({ key, name }) => {
      if (content[key] && content[key].length > 0) {
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

  const fetchFinancialData = React.useCallback(
    (workbookId: string, chatId: string) => {
      console.log(
        `🚀 Memulai koneksi stream untuk workbookId: ${workbookId} dan chatId: ${chatId}`
      );
      setLoading(true);

      const eventSource = new EventSource(
        `/api/financials/${workbookId}?chatId=${chatId}`
      );

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data);
        console.log(
          "📊 Data yang diterima dari stream (Step Three):",
          eventData
        );

        if (
          eventData.type === "initial-data" ||
          eventData.type === "update-data"
        ) {
          parseAndSetTableData(eventData.data);
        } else if (eventData.type === "error") {
          console.error("❌ Error dari stream:", eventData.error);
          setDataLoaded(false);
          setLoading(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error("❌ Error koneksi EventSource:", error);
        setDataLoaded(false);
        setLoading(false);
        eventSource.close();
      };

      return () => {
        eventSource.close();
        console.log("🏁 Koneksi stream ditutup (Step Three).");
      };
    },
    [parseAndSetTableData]
  );

  React.useEffect(() => {
    let closeStream: (() => void) | undefined;

    if (workbookId && contextChatId) {
      closeStream = fetchFinancialData(workbookId, contextChatId);
    } else if (documentPreview) {
      parseAndSetTableData(documentPreview);
    } else {
      setLoading(false);
      setDataLoaded(false);
    }

    return () => {
      if (closeStream) {
        closeStream();
      }
    };
  }, [
    workbookId,
    contextChatId,
    documentPreview,
    fetchFinancialData,
    parseAndSetTableData,
  ]);

  return (
    <div className="w-full">
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
      ) : (
        <>
          {activeTab === "Laporan Laba Rugi" &&
            tableData["Laporan Laba Rugi"] && (
              <TableComponent
                headers={[
                  "Keterangan",
                  "Periode Laporan",
                  "Periode Pembanding",
                ]}
                rows={tableData["Laporan Laba Rugi"].report.map((item: any) => {
                  const row: any = [
                    item.keterangan,
                    item.periodeLaporan,
                    item.periodePembanding,
                  ];
                  if (item.isBold) {
                    row.isBold = true;
                  }
                  return row;
                })}
              />
            )}
          {activeTab === "Laporan Perubahan Ekuitas" &&
            tableData["Laporan Perubahan Ekuitas"] && (
              <TableComponent
                headers={["Komponen Ekuitas", "Jumlah"]}
                rows={tableData["Laporan Perubahan Ekuitas"]
                  .map((e: any) => [
                    ["Modal Awal", e.modalAwal],
                    ["Laba Bersih", e.labaBersih],
                    ["Dividen", e.dividen],
                    ...e.perubahanLain.map((p: any) => [
                      p.keterangan,
                      p.jumlah,
                    ]),
                    ["Modal Akhir", e.modalAkhir],
                  ])
                  .flat()}
              />
            )}
          {activeTab === "Laporan Posisi Keuangan" &&
            tableData["Laporan Posisi Keuangan"] && (
              <TableComponent
                headers={["Kategori", "Nama Akun", "Jumlah (Rp)"]}
                rows={tableData["Laporan Posisi Keuangan"].flatMap((e: any) => [
                  ...e.asetLancar.map((a: any) => [
                    "Aset Lancar",
                    a.akun,
                    a.jumlah,
                  ]),
                  ...e.asetTetap.map((a: any) => [
                    "Aset Tetap",
                    a.akun,
                    a.jumlah,
                  ]),
                  ...e.kewajibanJangkaPendek.map((k: any) => [
                    "Kewajiban Jangka Pendek",
                    k.akun,
                    k.jumlah,
                  ]),
                  ...e.kewajibanJangkaPanjang.map((k: any) => [
                    "Kewajiban Jangka Panjang",
                    k.akun,
                    k.jumlah,
                  ]),
                  ...e.ekuitas.map((eq: any) => [
                    "Ekuitas",
                    eq.akun,
                    eq.jumlah,
                  ]),
                ])}
              />
            )}
          {activeTab === "Laporan Arus Kas" &&
            tableData["Laporan Arus Kas"] && (
              <TableComponent
                headers={["Aktivitas", "Keterangan", "Jumlah (Rp)"]}
                rows={tableData["Laporan Arus Kas"].flatMap((e: any) => [
                  ...e.aktivitasOperasi.map((o: any) => [
                    "Operasi",
                    o.keterangan,
                    o.jumlah,
                  ]),
                  ...e.aktivitasInvestasi.map((i: any) => [
                    "Investasi",
                    i.keterangan,
                    i.jumlah,
                  ]),
                  ...e.aktivitasPendanaan.map((p: any) => [
                    "Pendanaan",
                    p.keterangan,
                    p.jumlah,
                  ]),
                ])}
              />
            )}
        </>
      )}
    </div>
  );
};
