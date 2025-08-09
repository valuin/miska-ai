"use client";
import * as React from "react";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { TableComponent, SkeletonTables } from "./shared-components";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { CardPersediaan } from "../analytics/card-persediaan";

export const StepTwoPreview = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const { setDocumentPreview } = useDocumentPreviewStore();
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);
  const tabs = [
    "Perhitungan Persediaan (FIFO) + Jurnal",
    "Penyusutan Aset Tetap + Jurnal",
    "Jurnal Penyesuaian",
    "Rekonsiliasi Bank",
    "Neraca Penyesuaian",
    "Neraca Saldo Setelah Penyesuaian",
  ];

  const fifoTable: string[][] = [
    [
      "2025-01-01",
      "Pembelian Barang A",
      "100",
      "10.000",
      "",
      "",
      "100",
      "1.000.000",
    ],
    ["2025-01-03", "Penjualan", "", "", "60", "10.000", "40", "400.000"],
  ];
  const fifoJurnal: string[][] = [
    ["Persediaan Barang", "1.000.000"],
    ["    Kas", "1.000.000"],
    ["(Pembelian Barang A)", ""],
    ["Harga Pokok Penjualan", "600.000"],
    ["    Persediaan Barang", "600.000"],
    ["(Pengurangan persediaan karena penjualan FIFO)", ""],
  ];
  const penyusutanTable: string[][] = [
    ["Laptop", "12.000.000", "4", "2.000.000", "2.500.000", "208.333"],
  ];
  const penyusutanJurnal: string[][] = [
    ["Beban Penyusutan", "208.333"],
    ["    Akumulasi Penyusutan", "208.333"],
    ["(Pencatatan penyusutan bulan Januari)", ""],
  ];
  const penyesuaianJurnal: string[][] = [
    ["Beban Sewa Dibayar Di Muka", "500.000"],
    ["    Sewa Dibayar Di Muka", "500.000"],
    ["(Alokasi biaya sewa selama bulan berjalan)", ""],
    ["Pendapatan Diterima Di Muka", "1.000.000"],
    ["    Pendapatan", "1.000.000"],
    ["(Pengakuan pendapatan yang sudah diperoleh)", ""],
  ];
  const rekonsiliasiBank1: string[][] = [
    ["Saldo menurut bank", "10.000.000"],
    ["(+) Setoran dalam perjalanan", "1.000.000"],
    ["(-) Cek yang belum dicairkan", "500.000"],
    ["(=) Saldo yang disesuaikan (bank)", "10.500.000"],
  ];
  const rekonsiliasiBank2: string[][] = [
    ["Saldo menurut buku perusahaan", "10.000.000"],
    ["(+) Bunga bank", "500.000"],
    ["(-) Biaya administrasi bank", "100.000"],
    ["(=) Saldo yang disesuaikan (buku)", "10.400.000"],
  ];
  const rekonsiliasiJurnal: string[][] = [
    ["Kas", "500.000"],
    ["    Pendapatan Bunga", "500.000"],
    ["(Pencatatan bunga bank)", ""],
    ["Beban Administrasi", "100.000"],
    ["    Kas", "100.000"],
    ["(Pencatatan biaya administrasi bank)", ""],
  ];
  const neracaPenyesuaian: string[][] = [
    ["1101", "Kas", "10.400.000", ""],
    ["1201", "Peralatan", "12.000.000", ""],
    ["1202", "Akumulasi Penyusutan", "", "208.333"],
    ["3101", "Modal", "", "10.000.000"],
    ["4101", "Pendapatan", "", "1.000.000"],
    ["5101", "Beban Penyusutan", "208.333", ""],
    ["5102", "Beban Administrasi Bank", "100.000", ""],
  ];
  const neracaPost: string[][] = [...neracaPenyesuaian];

  React.useEffect(() => {
    const data = {
      step: 2,
      fifoTable,
      fifoJurnal,
      penyusutanTable,
      penyusutanJurnal,
      penyesuaianJurnal,
      rekonsiliasiBank1,
      rekonsiliasiBank2,
      rekonsiliasiJurnal,
      neracaPenyesuaian,
      neracaPost,
    };
    setDocumentPreview(data);
    return () => {
      setDocumentPreview(null);
    };
  }, [setDocumentPreview]);

  return (
    <div className="w-full">
      <div className="flex border-b mb-4 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 whitespace-nowrap ${activeTab === i ? "border-b-2 border-primary" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {loading ? (
        <SkeletonTables />
      ) : (
        <>
          {activeTab === 0 && (
            <>
              <div className="flex justify-between">
                <div className="flex gap-4">
                  <Input placeholder="Cari..." />
                  <Input placeholder="filter" />
                </div>
                <Button className="bg-green-950">
                  <Download size={24} color="white" />
                  <p className="text-white">Unduh File</p>
                </Button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <CardPersediaan
                  amount="Rp 850.500.000"
                  description="Per 1 Januari 2025"
                  title="Nilai Persediaan Awal"
                  imageUrl="/images/box-icon.png"
                />
                <CardPersediaan
                  amount="Rp 4.200.750.000"
                  description="Terdiri dari 125 transaksi pembelian"
                  title="Terdiri dari 125 transaksi pembelian"
                  imageUrl="/images/card-shopping-icon.png"
                />
                <CardPersediaan
                  amount="Rp 4.800.250.000"
                  description="Berdasarkan 1.500 unit terjual"
                  title="Harga Pokok Penjualan (HPP)"
                  imageUrl="/images/arrow-up-icon.png"
                />
                <CardPersediaan
                  amount="Rp 251.000.000"
                  description="per 31 Desember 2024"
                  title="Saldo Akhir"
                  imageUrl="/images/money-icon.png"
                />
              </div>

              <TableComponent
                headers={[
                  "Tanggal",
                  "Keterangan",
                  "Qty Masuk",
                  "Harga Masuk",
                  "Qty Keluar",
                  "Harga Keluar",
                  "Sisa Qty",
                  "Nilai Persediaan",
                ]}
                rows={fifoTable}
              />
              <TableComponent headers={["Akun", "Jumlah"]} rows={fifoJurnal} />
            </>
          )}
          {activeTab === 1 && (
            <>
              <TableComponent
                headers={[
                  "Aset",
                  "Harga Perolehan",
                  "Umur (thn)",
                  "Nilai Sisa",
                  "Penyusutan/Tahun",
                  "Penyusutan/Bulan",
                ]}
                rows={penyusutanTable}
              />
              <TableComponent
                headers={["Akun", "Jumlah"]}
                rows={penyusutanJurnal}
              />
            </>
          )}
          {activeTab === 2 && (
            <TableComponent
              headers={["Akun", "Jumlah"]}
              rows={penyesuaianJurnal}
            />
          )}
          {activeTab === 3 && (
            <>
              <TableComponent
                headers={["Keterangan", "Jumlah"]}
                rows={rekonsiliasiBank1}
              />
              <TableComponent
                headers={["Keterangan", "Jumlah"]}
                rows={rekonsiliasiBank2}
              />
              <TableComponent
                headers={["Akun", "Jumlah"]}
                rows={rekonsiliasiJurnal}
              />
            </>
          )}
          {activeTab === 4 && (
            <TableComponent
              headers={["No. Akun", "Nama Akun", "Debit", "Kredit"]}
              rows={neracaPenyesuaian}
            />
          )}
          {activeTab === 5 && (
            <TableComponent
              headers={["No. Akun", "Nama Akun", "Debit", "Kredit"]}
              rows={neracaPost}
            />
          )}
        </>
      )}
    </div>
  );
};
