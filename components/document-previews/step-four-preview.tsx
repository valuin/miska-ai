"use client";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { useFinancials } from "./financials-context";
import { SkeletonTables } from "./shared-components";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Download,
  DollarSign,
  BarChart,
  TrendingUp,
  Scale,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Progress } from "../ui/progress";

import type { UIMessage } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import { PreviewMessage } from "../message";
import { useEffect, useState } from "react";

interface StepFourPreviewProps {
  chatId?: string;
  messages?: Array<UIMessage>;
  setMessages?: UseChatHelpers["setMessages"];
  reload?: UseChatHelpers["reload"];
  append?: UseChatHelpers["append"];
}

export const StepFourPreview = ({
  chatId,
  messages,
  setMessages,
  reload,
  append,
}: StepFourPreviewProps) => {
  const [loading, setLoading] = useState(true);
  const { documentPreview } = useDocumentPreviewStore();
  const { workbookId, chatId: contextChatId } = useFinancials();
  const [finalResultData, setFinalResultData] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let eventSource: EventSource;

    const connectToStream = (workbookId: string, chatId: string) => {
      setLoading(true);
      eventSource = new EventSource(
        `/api/financials/${workbookId}?chatId=${chatId}`
      );

      eventSource.onmessage = (event) => {
        const eventData = JSON.parse(event.data);
        console.log(
          "📊 Data yang diterima dari stream (Step Four):",
          eventData
        );

        if (
          (eventData.type === "initial-data" ||
            eventData.type === "update-data") &&
          eventData.data.finalResultData
        ) {
          setFinalResultData(eventData.data.finalResultData);
          setDataLoaded(true);
        } else if (eventData.type === "error") {
          console.error("❌ Error dari stream:", eventData.error);
          setDataLoaded(false);
          eventSource.close();
        }
        setLoading(false);
      };

      eventSource.onerror = (error) => {
        console.error("❌ Error koneksi EventSource:", error);
        setDataLoaded(false);
        setLoading(false);
        eventSource.close();
      };
    };

    if (workbookId && contextChatId) {
      connectToStream(workbookId, contextChatId);
    } else if (documentPreview && documentPreview.content?.finalResultData) {
      setFinalResultData(documentPreview.content.finalResultData);
      setDataLoaded(true);
      setLoading(false);
    } else {
      setLoading(false);
      setDataLoaded(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
        console.log("🏁 Koneksi stream ditutup (Step Four).");
      }
    };
  }, [workbookId, contextChatId, documentPreview]);

  if (loading) {
    return <SkeletonTables />;
  }

  if (!dataLoaded || !finalResultData) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">
          Tidak ada data yang tersedia untuk langkah ini.
        </p>
      </div>
    );
  }

  const { dashboard } = finalResultData;
  const { kpiUtama, perbandinganBulanan, rasioKeuangan, analisisKualitatif } =
    dashboard;

  return (
    <div className="w-full space-y-6">
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Dashboard Analisis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {dashboard.companyName} - {dashboard.period}
        </p>

        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Input placeholder="Cari..." className="w-48" />
            <Button variant="outline" className="flex items-center gap-2">
              <span>Filter</span>
            </Button>
          </div>
          <Button className="bg-green-950 hover:bg-green-900 text-white">
            <Download size={16} className="mr-2 fill-white" />
            <span>Unduh File</span>
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-lime-50 dark:bg-green-900/20 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-gradient-to-b from-[#A6E564] to-[#054135]  rounded-full flex items-center justify-center">
                <DollarSign className="text-white text-xl" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Pendapatan
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {kpiUtama.totalPendapatan.total}
                </p>
              </div>
            </div>
            <div
              className={`text-${kpiUtama.totalPendapatan.status === "naik" ? "green" : "red"}-700 px-3 py-1 rounded-full text-sm border border-${kpiUtama.totalPendapatan.status === "naik" ? "green" : "red"}-700`}
            >
              {kpiUtama.totalPendapatan.status === "naik" ? "↗" : "↘"}{" "}
              {kpiUtama.totalPendapatan.perubahanPersentase}
            </div>
          </div>
        </div>

        <div className="bg-lime-50 dark:bg-green-900/20 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-gradient-to-b from-[#A6E564] to-[#054135]  rounded-full flex items-center justify-center">
              <BarChart className="text-white text-xl" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Laba Bersih
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {kpiUtama.labaBersih.total}
              </p>
            </div>
            <div
              className={`text-${kpiUtama.labaBersih.status === "naik" ? "green" : "red"}-700 px-3 py-1 rounded-full text-sm border border-${kpiUtama.labaBersih.status === "naik" ? "green" : "red"}-700`}
            >
              {kpiUtama.labaBersih.status === "naik" ? "↗" : "↘"}{" "}
              {kpiUtama.labaBersih.perubahanPersentase}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="size-10 bg-gradient-to-b from-[#A6E564] to-[#054135]  rounded-full flex items-center justify-center">
                <TrendingUp className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Tren Pendapatan vs. Laba Bersih 2024
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Perbandingan bulanan total pendapatan (bar) dan laba bersih
                  (garis)
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={perbandinganBulanan.map((item: any) => ({
                    month: item.bulan,
                    pendapatan: item.totalPendapatan,
                    labaBersih: item.labaBersih,
                  }))}
                >
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#054135" />
                      <stop offset="100%" stopColor="#A6E564" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                    }}
                  />

                  <Bar
                    dataKey="pendapatan"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    name="Total Pendapatan"
                  />
                  <Line
                    type="monotone"
                    dataKey="labaBersih"
                    stroke="#84cc16"
                    strokeWidth={3}
                    dot={{ fill: "#84cc16", strokeWidth: 2, r: 4 }}
                    name="Laba Bersih"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="size-4 bg-green-600 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Pendapatan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-lime-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Laba Bersih
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Ratios */}
        <div className="space-y-4">
          {/* Current Ratio */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 bg-gradient-to-b from-[#A6E564] to-[#054135]  rounded-full flex items-center justify-center">
                <Scale className="text-white text-sm" />
              </div>
              <h4 className="font-semibold text-black dark:text-white">
                Current Ratio
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {rasioKeuangan.currentRatio.nilai}
                </span>
                <span
                  className={`text-${rasioKeuangan.currentRatio.interpretasi === "Sehat" ? "green" : "red"}-600 font-medium`}
                >
                  {rasioKeuangan.currentRatio.interpretasi}
                </span>
              </div>
              <Progress
                value={parseFloat(rasioKeuangan.currentRatio.nilai)}
                className="[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:via-yellow-500 [&>*]:to-green-500"
              />
            </div>
          </div>

          {/* Debt to Equity Ratio */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 bg-red-600 rounded-full flex items-center justify-center">
                <Percent className="text-white text-sm" />
              </div>
              <h4 className="font-semibold text-black dark:text-white">
                Debt to Equity
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {rasioKeuangan.debtToEquityRatio.nilai}
                </span>
                <span
                  className={`text-${rasioKeuangan.debtToEquityRatio.interpretasi === "Sehat" ? "green" : "orange"}-600 font-medium`}
                >
                  {rasioKeuangan.debtToEquityRatio.interpretasi}
                </span>
              </div>
              <Progress
                value={parseFloat(rasioKeuangan.debtToEquityRatio.nilai)}
                className="[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:via-yellow-500 [&>*]:to-green-500"
              />
            </div>
          </div>

          {/* ROE */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 bg-gradient-to-b from-[#A6E564] to-[#054135] rounded-full flex items-center justify-center">
                <BarChart className="text-white text-sm" />
              </div>
              <h4 className="font-semibold text-black dark:text-white">
                Return on Equity
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {rasioKeuangan.returnOnEquity.nilai}
                </span>
                <span
                  className={`text-${rasioKeuangan.returnOnEquity.interpretasi === "Sangat Baik" ? "green" : "red"}-600 font-medium`}
                >
                  {rasioKeuangan.returnOnEquity.interpretasi}
                </span>
              </div>
              <Progress
                value={parseFloat(rasioKeuangan.returnOnEquity.nilai)}
                className="[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:via-yellow-500 [&>*]:to-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-green-700 text-2xl" />
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Ringkasan Analisis
          </h3>
        </div>

        <div className="bg-gradient-to-r from-[#D2F2B1] to-[#A6E564] rounded-lg p-4 mb-4">
          <p className="text-sm text-black dark:text-white">
            {analisisKualitatif.ringkasanAnalisis}
          </p>
        </div>

        <div className="space-y-3 rounded-xl p-6 border border-gray-200">
          <div className="flex items-start gap-3">
            <Scale className="text-lg mt-0.5 text-green-700" />
            <div>
              <h4 className="font-medium text-black dark:text-white mb-1">
                Poin untuk Diperhatikan:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {analisisKualitatif.poinUntukDiperhatikan.map(
                  (poin: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{poin}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
