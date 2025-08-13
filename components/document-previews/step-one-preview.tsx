// step-one-preview.tsx - Updated version
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { TableComponent, SkeletonTables } from "./shared-components";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Download } from "lucide-react";

import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { PreviewMessage } from "../message";
import { useCallback, useEffect, useState } from "react";

interface StepOnePreviewProps {
  chatId?: string;
  messages?: Array<UIMessage>;
  setMessages?: UseChatHelpers["setMessages"];
  reload?: UseChatHelpers["reload"];
  append?: UseChatHelpers["append"];
  // Add runtimeContext as prop to access server data
  runtimeContext?: any;
}

export const StepOnePreview = ({
  chatId,
  messages,
  setMessages,
  reload,
  append,
  runtimeContext,
}: StepOnePreviewProps) => {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { documentPreview, setDocumentPreview } = useDocumentPreviewStore();
  const [testData, settestData] = useState([]);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [tableData, setTableData] = useState<Record<string, any[]>>({});
  const [dataLoaded, setDataLoaded] = useState(false);

  const parseAndSetTableData = useCallback(
    (previewData: any) => {
      if (!previewData || !previewData.content) {
        setLoading(false);
        setDataLoaded(false);
        return;
      }
      const { content } = previewData;
      const newTableData: Record<string, any[]> = {};
      const newAvailableTabs: string[] = [];

      const dataMapping = [
        {
          key: "jurnalData",
          name: "Jurnal Umum",
          columns: ["tanggal", "keterangan", "namaAkun", "debit", "kredit"],
        },
        {
          key: "bukuData",
          name: "Buku Besar",
          columns: ["tanggal", "keterangan", "debit", "kredit", "saldo"],
        },
        {
          key: "neracaData",
          name: "Neraca Saldo",
          columns: ["kodeAkun", "namaAkun", "debit", "kredit"],
        },
      ];

      dataMapping.forEach(({ key, name, columns }) => {
        if (content[key] && content[key].length > 0) {
          newTableData[name] = content[key].map((entry: any) =>
            columns.map(
              (col) =>
                entry[col] ||
                (col === "debit" || col === "kredit" || col === "saldo"
                  ? "0"
                  : "")
            )
          );
          newAvailableTabs.push(name);
        }
      });

      setTableData(newTableData);
      setAvailableTabs(newAvailableTabs);

      if (newAvailableTabs.length > 0) {
        setActiveTab(newAvailableTabs[0] || null);
        setDataLoaded(true);
        // Simpan data asli yang belum di-parse ke store
        setDocumentPreview(previewData);
      } else {
        setDataLoaded(false);
      }

      setLoading(false);
    },
    [setDocumentPreview]
  );
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
        settestData(data);
      }
      console.log("testestes", data.jurnalData);
    } catch (error) {
      console.error("❌ Error fetching financial data:", error);
      setDataLoaded(false);
    } finally {
      setLoading(false);
      console.log("🏁 Proses fetch selesai.");
    }
  };
  useEffect(() => {
    const workbookId = documentPreview?.workbookId;
    const chatIdFromUrl = window.location.pathname.split("/").pop();

    if (workbookId && chatIdFromUrl) {
      fetchFinancialData(workbookId, chatIdFromUrl);
    } else {
      const lastMessage = messages?.[messages.length - 1];
      if (lastMessage?.toolInvocations) {
        for (const invocation of lastMessage.toolInvocations) {
          if (
            invocation.toolName === "parse-vault-financial-document" &&
            (invocation as any).result?.content
          ) {
            parseAndSetTableData((invocation as any).result);
            return;
          }
        }
      }
      setLoading(false);
      setDataLoaded(false);
    }
  }, [documentPreview, messages, parseAndSetTableData]);

  const getHeadersForTab = (tabName: string | null) => {
    switch (tabName) {
      case "Jurnal Umum":
        return ["Tanggal", "Keterangan", "Akun", "Debit", "Kredit"];
      case "Buku Besar":
        return ["Tanggal", "Keterangan", "Debit", "Kredit", "Saldo"];
      case "Neraca Saldo":
        return ["No. Akun", "Nama Akun", "Debit", "Kredit"];
      default:
        return [];
    }
  };

  return (
    <div className="w-full">
      {/* Tombol untuk testing fetch */}
      <Button
        onClick={() =>
          fetchFinancialData(
            "7a0e8128-0cfa-4f27-aae8-8789580b3fdf",
            "e60668df-3083-4aa3-a892-5bdc50e24ccd"
          )
        }
        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white"
      >
        Testing Fetch
      </Button>
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

      {availableTabs.length > 0 && (
        <div className="flex border-b mb-4">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 ${
                activeTab === tab ? "border-b-2 border-primary" : ""
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonTables />
      ) : (
        <>
          <div className="flex justify-between my-4">
            <div className="flex gap-4">
              <Input placeholder="Cari..." />
              <Input placeholder="Filter" />
            </div>
            <Button className="bg-green-950 flex items-center gap-2">
              <Download size={20} color="white" />
              <p className="text-white">Unduh File</p>
            </Button>
          </div>
          {activeTab && tableData[activeTab] && (
            <TableComponent
              headers={getHeadersForTab(activeTab)}
              rows={tableData[activeTab]}
            />
          )}
        </>
      )}
    </div>
  );
};
