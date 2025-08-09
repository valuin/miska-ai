"use client";
import * as React from "react";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { TableComponent, SkeletonTables } from "./shared-components";

export const StepThreePreview = () => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const { setDocumentPreview } = useDocumentPreviewStore();
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);
  const tabs = [
    "Laporan Laba Rugi",
    "Laporan Perubahan Ekuitas",
    "Laporan Posisi Keuangan",
    "Laporan Arus Kas",
    "Catatan atas Laporan Keuangan",
  ];

  const labaRugi = [
    ["Pendapatan", "Pendapatan Jasa", "50.000.000"],
    ["Beban", "Gaji", "15.000.000"],
    ["Baban", "Beban Operasional Lainnya", "5.000.000"],
    ["Total Laba Bersih", "", "30.000.000"],
  ];

  const perubahanEkuitas = [
    ["Modal Awal", "100.000.000", "-", "100.000.000"],
    ["Laba Bersih", "-", "30.000.000", "30.000.000"],
    ["Prive", "-", "(5.000.000)", "(5.000.000)"],
    ["Ekuitas Akhir", "", "", "125.000.000"],
  ];

  const posisiKeuangan = [
    ["Aset", "Kas", "50.000.000"],
    ["Aset", "Piutang", "20.000.000"],
    ["Aset", "Peralatan (net)", "40.000.000"],
    ["Liabilitas", "Utang Usaha", "10.000.000"],
    ["Ekuitas", "Modal Akhir", "100.000.000"],
    ["Total", "", "150.000.000"],
  ];

  const arusKas = [
    ["Operasional", "Kas dari pelanggan", "70.000.000"],
    ["Operasional", "Pembayaran gaji", "(20.000.000)"],
    ["Investasi", "Pembelian aset tetap", "(10.000.000)"],
    ["Pendanaan", "Penambahan modal", "30.000.000"],
    ["Saldo Akhir Kas", "", "70.000.000"],
  ];

  const catatan = [
    ["Metode penyusutan", "Garis lurus"],
    ["Pengakuan pendapatan", "Saat jasa diselesaikan"],
    ["Estimasi masa manfaat aset tetap", "..."],
    ["Rincian saldo kas dan piutang", "..."],
  ];

  React.useEffect(() => {
    const data = {
      step: 3,
      labaRugi,
      perubahanEkuitas,
      posisiKeuangan,
      arusKas,
      catatan,
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
            <TableComponent
              headers={["Kategori", "Nama Akun", "Jumlah (Rp)"]}
              rows={labaRugi}
            />
          )}
          {activeTab === 1 && (
            <TableComponent
              headers={[
                "Komponen Ekuitas",
                "Saldo Awal",
                "Perubahan",
                "Saldo Akhir",
              ]}
              rows={perubahanEkuitas}
            />
          )}
          {activeTab === 2 && (
            <TableComponent
              headers={["Kategori", "Nama Akun", "Jumlah (Rp)"]}
              rows={posisiKeuangan}
            />
          )}
          {activeTab === 3 && (
            <TableComponent
              headers={["Aktivitas", "Deskripsi", "Jumlah (Rp)"]}
              rows={arusKas}
            />
          )}
          {activeTab === 4 && (
            <TableComponent headers={["Judul", "Detail"]} rows={catatan} />
          )}
        </>
      )}
    </div>
  );
};
