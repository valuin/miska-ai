"use client";
import * as React from "react";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
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
import { CardPersediaan } from "../analytics/card-persediaan";
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

// Data untuk chart pendapatan vs laba bersih
const chartData = [
  { month: "Jan", pendapatan: 4.5, labaBersih: 6.0 },
  { month: "Feb", pendapatan: 7.5, labaBersih: 2.2 },
  { month: "Mar", pendapatan: 3.2, labaBersih: 8.0 },
  { month: "Apr", pendapatan: 5.0, labaBersih: 5.5 },
  { month: "May", pendapatan: 4.8, labaBersih: 3.8 },
  { month: "Jun", pendapatan: 6.2, labaBersih: 5.0 },
  { month: "Jul", pendapatan: 3.5, labaBersih: 2.8 },
  { month: "Aug", pendapatan: 5.5, labaBersih: 6.0 },
  { month: "Sep", pendapatan: 8.5, labaBersih: 5.8 },
  { month: "Oct", pendapatan: 3.5, labaBersih: 7.5 },
  { month: "Nov", pendapatan: 2.8, labaBersih: 7.8 },
  { month: "Dec", pendapatan: 2.5, labaBersih: 1.8 },
];

export const StepFourPreview = () => {
  const [loading, setLoading] = React.useState(true);
  const { setDocumentPreview } = useDocumentPreviewStore();

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    const data = {
      step: 4,
      chartData,
      totalPendapatan: "15.3 Miliar",
      labaBersih: "2.8 Miliar",
      currentRatio: 85,
      debtToEquityRatio: 45,
      roe: 78,
    };
    setDocumentPreview(data);
    return () => {
      setDocumentPreview(null);
    };
  }, [setDocumentPreview]);

  if (loading) {
    return <SkeletonTables />;
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
          Dashboard Analisis
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          PT Karya Konstruksi Prima - 2024
        </p>

        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <Input placeholder="Cari..." className="w-48" />
            <Button variant="outline" className="flex items-center gap-2">
              <span>Filter</span>
            </Button>
          </div>
          <Button className="bg-green-950 hover:bg-green-900">
            <Download size={16} className="mr-2" />
            <span className="text-white">Unduh File</span>
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-100 dark:bg-green-900/20 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-gradient-to-b from-green-400 to-green-700  rounded-full flex items-center justify-center">
                <DollarSign className="text-white text-xl" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Pendapatan
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  Rp 15.3 Miliar
                </p>
              </div>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              ↗ 12.5%
            </div>
          </div>
        </div>

        <div className="bg-green-100 dark:bg-green-900/20 rounded-xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-gradient-to-b from-green-400 to-green-700  rounded-full flex items-center justify-center">
              <BarChart className="text-white text-xl" />
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Laba Bersih
              </p>
              <p className="text-2xl font-bold text-black dark:text-white">
                Rp 2.8 Miliar
              </p>
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
              <div className="size-10 bg-gradient-to-b from-green-400 to-green-700  rounded-full flex items-center justify-center">
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
                <ComposedChart data={chartData}>
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
                    fill="#16a34a"
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
                <div className="size-4 bg-green-600 rounded"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Total Pendapatan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-lime-500 rounded"></div>
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
              <div className="size-8 bg-gradient-to-b from-green-400 to-green-700  rounded-full flex items-center justify-center">
                <Scale className="text-white text-sm" />
              </div>
              <h4 className="font-semibold text-black dark:text-white">
                Current Ratio
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">85%</span>
                <span className="text-green-600 font-medium">Baik</span>
              </div>
              <Progress
                value={85}
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
                <span className="text-gray-600 dark:text-gray-400">45%</span>
                <span className="text-orange-600 font-medium">Sedang</span>
              </div>
              <Progress
                value={45}
                className="[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:via-yellow-500 [&>*]:to-green-500"
              />
            </div>
          </div>

          {/* ROE */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 bg-green-700 rounded-full flex items-center justify-center">
                <BarChart className="text-white text-sm" />
              </div>
              <h4 className="font-semibold text-black dark:text-white">
                Return on Equity
              </h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">78%</span>
                <span className="text-green-600 font-medium">Sangat Baik</span>
              </div>
              <Progress
                value={78}
                className="[&>*]:bg-gradient-to-r [&>*]:from-red-500 [&>*]:via-yellow-500 [&>*]:to-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-green-700 text-2xl" />
          <h3 className="text-lg font-semibold text-black dark:text-white">
            Ringkasan Analisis
          </h3>
        </div>

        <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-black dark:text-white">
            Analisis menunjukkan tahun 2024 adalah tahun pertumbuhan yang kuat
            untuk PT KKP, dengan posisi keuangan perusahaan sangat sehat dan
            likuid.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Scale className="text-lg mt-0.5 text-green-700" />
            <div>
              <h4 className="font-medium text-black dark:text-white mb-1">
                Poin untuk Diperhatikan:
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    <strong>Ketergantungan Kuartal 4:</strong> Hampir 40% dari
                    laba tahunan berasal dari Q4. Perlu diwaspadai jika ada
                    volatilitas musiman.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    <strong>Efisiensi Biaya:</strong> Beban Pokok Penjualan naik
                    sedikit lebih cepat dari pendapatan. Ini menekan margin
                    profit secara bertahap.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
