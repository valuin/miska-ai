// step-one-preview.tsx - Updated version
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { TableComponent, SkeletonTables } from "./shared-components";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Download, Edit, Trash2 } from "lucide-react";

import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { PreviewMessage } from "../message";
import { useCallback, useEffect, useState } from "react";
import { useFinancials } from "./financials-context";

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
  const { workbookId, chatId: contextChatId } = useFinancials();
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
        setActiveTab(newAvailableTabs.length > 0 ? newAvailableTabs[0] : null);
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
  const fetchFinancialData = useCallback(
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
        console.log("📊 Data yang diterima dari stream:", eventData);

        if (
          eventData.type === "initial-data" ||
          eventData.type === "update-data"
        ) {
          parseAndSetTableData({ content: eventData.data });
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
        console.log("🏁 Koneksi stream ditutup.");
      };
    },
    [parseAndSetTableData]
  );

  useEffect(() => {
    let closeStream: () => void;

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

  const handleEdit = () => {
    // Placeholder for edit logic
    console.log("Edit button clicked!");
    // You would typically open a modal or navigate to an edit page here
    // and then call the updateFinancialDataTool with the updated data.
  };

  const handleDelete = () => {
    // Placeholder for delete logic
    console.log("Delete button clicked!");
    // You would typically confirm with the user and then call the deleteFinancialDataTool
    // with the ID of the data to be deleted.
  };

  return (
    <div className="w-full">
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
            <div className="flex gap-2">
              <Button
                className="bg-blue-950 flex items-center gap-2"
                onClick={handleEdit}
              >
                <Edit size={20} color="white" />
                <p className="text-white">Edit</p>
              </Button>
              <Button
                className="bg-red-950 flex items-center gap-2"
                onClick={handleDelete}
              >
                <Trash2 size={20} color="white" />
                <p className="text-white">Delete</p>
              </Button>
              <Button className="bg-green-950 flex items-center gap-2">
                <Download size={20} color="white" />
                <p className="text-white">Unduh File</p>
              </Button>
            </div>
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
