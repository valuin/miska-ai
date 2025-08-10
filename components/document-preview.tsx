"use client";
import * as React from "react";

import { useArtifact } from "@/hooks/use-artifact";
import type { Document } from "@/lib/db/schema";
import { cn, fetcher } from "@/lib/utils";
import equal from "fast-deep-equal";
import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import useSWR from "swr";
import type { ArtifactKind, UIArtifact } from "./artifact";
import { useMessageCountStore } from "./chat-with-preview";
import { CodeEditor } from "./code-editor";
import { DocumentToolCall, DocumentToolResult } from "./document";
import { StepFourPreview } from "./document-previews/step-four-preview";
import { StepOnePreview } from "./document-previews/step-one-preview";
import { StepThreePreview } from "./document-previews/step-three-preview";
import { StepTwoPreview } from "./document-previews/step-two-preview";
import { InlineDocumentSkeleton } from "./document-skeleton";
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from "./icons";
import { ImageEditor } from "./image-editor";
import { SpreadsheetEditor } from "./sheet-editor";
import { Editor } from "./text-editor";
import { DocumentToolCall, DocumentToolResult } from "./document";
import { CodeEditor } from "./code-editor";
import { useArtifact } from "@/hooks/use-artifact";
import equal from "fast-deep-equal";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { CardPersediaan } from "./analytics/card-persediaan";
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

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: any;
  args?: any;
}

const renderPreviewForMessageCount = (count?: number) => {
  if (!count || count < 1) return null;
  if (count === 2) return <StepTwoPreview />;
  if (count === 3) return <StepThreePreview />;
  if (count === 4) return <StepFourPreview />;
  return <StepOnePreview />;
};

const getDerivedDocument = (
  artifact: ReturnType<typeof useArtifact>["artifact"],
  previewDocument: Document | undefined | null
): Document | null => {
  if (previewDocument) return previewDocument;
  if (artifact.status === "streaming") {
    return {
      title: artifact.title,
      kind: artifact.kind,
      content: artifact.content,
      id: artifact.documentId,
      createdAt: new Date(),
      userId: "noop",
    };
  }
  return null;
};

const useSyncBoundingBox = (
  artifact: ReturnType<typeof useArtifact>["artifact"],
  setArtifact: ReturnType<typeof useArtifact>["setArtifact"],
  hitboxRef: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    const boundingBox = hitboxRef.current?.getBoundingClientRect();
    if (artifact.documentId && boundingBox) {
      setArtifact((curr) => ({
        ...curr,
        boundingBox: {
          left: boundingBox.x,
          top: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
        },
      }));
    }
  }, [hitboxRef, setArtifact, artifact.documentId]);
};

export function DocumentPreview({
  isReadonly,
  result,
  args,
}: DocumentPreviewProps) {
  const { messageCount } = useMessageCountStore();
  const { artifact, setArtifact } = useArtifact();

  const { data: documents, isLoading: isDocumentsFetching } = useSWR<
    Array<Document>
  >(result ? `/api/document?id=${result.id}` : null, fetcher);

  const previewDocument = useMemo(() => documents?.[0], [documents]);
  const hitboxRef = useRef<HTMLDivElement>(null);

  useSyncBoundingBox(artifact, setArtifact, hitboxRef);

  const previewNode = renderPreviewForMessageCount(messageCount);
  if (previewNode) return previewNode;

  if (artifact.isVisible) {
    if (result) {
      return (
        <DocumentToolResult
          type="create"
          result={{ id: result.id, title: result.title, kind: result.kind }}
          isReadonly={isReadonly}
        />
      );
    }
    if (args) {
      return (
        <DocumentToolCall
          type="create"
          args={{ title: args.title }}
          isReadonly={isReadonly}
        />
      );
    }
  }

  if (isDocumentsFetching) {
    const kind: ArtifactKind = (result?.kind ??
      args?.kind ??
      artifact.kind) as ArtifactKind;
    return <LoadingSkeleton artifactKind={kind} />;
  }

  const document = getDerivedDocument(artifact, previewDocument);

  if (!document) {
    return <LoadingSkeleton artifactKind={artifact.kind} />;
  }

  return (
    <DocumentContainer
      hitboxRef={hitboxRef}
      result={result}
      setArtifact={setArtifact}
      title={document.title}
      kind={document.kind}
      isStreaming={artifact.status === "streaming"}
      document={document}
    />
  );
}

const LoadingSkeleton = ({ artifactKind }: { artifactKind: ArtifactKind }) => (
  <div className="w-full">
    <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-center justify-between dark:bg-muted h-[57px] dark:border-zinc-700 border-b-0">
      <div className="flex flex-row items-center gap-3">
        <div className="text-muted-foreground">
          <div className="animate-pulse rounded-md size-4 bg-muted-foreground/20" />
        </div>
        <div className="animate-pulse rounded-lg h-4 bg-muted-foreground/20 w-24" />
      </div>
      <div>
        <FullscreenIcon />
      </div>
    </div>
    {artifactKind === "image" ? (
      <div className="overflow-y-scroll border rounded-b-2xl bg-muted border-t-0 dark:border-zinc-700">
        <div className="animate-pulse h-[257px] bg-muted-foreground/20 w-full" />
      </div>
    ) : (
      <div className="overflow-y-scroll border rounded-b-2xl p-8 pt-4 bg-muted border-t-0 dark:border-zinc-700">
        <InlineDocumentSkeleton />
      </div>
    )}
  </div>
);

const PureHitboxLayer = ({
  hitboxRef,
  result,
  setArtifact,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  result: any;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)
  ) => void;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();

      setArtifact((artifact) =>
        artifact.status === "streaming"
          ? { ...artifact, isVisible: true }
          : {
              ...artifact,
              title: result.title,
              documentId: result.id,
              kind: result.kind,
              isVisible: true,
              boundingBox: {
                left: boundingBox.x,
                top: boundingBox.y,
                width: boundingBox.width,
                height: boundingBox.height,
              },
            }
      );
    },
    [setArtifact, result]
  );

  return (
    <div
      className="size-full absolute top-0 left-0 rounded-xl z-10"
      ref={hitboxRef}
      onClick={handleClick}
      role="presentation"
      aria-hidden="true"
    >
      <div className="w-full p-4 flex justify-end items-center">
        <div className="absolute right-[9px] top-[13px] p-2 hover:dark:bg-zinc-700 rounded-md hover:bg-zinc-100">
          <FullscreenIcon />
        </div>
      </div>
    </div>
  );
};

const HitboxLayer = memo(PureHitboxLayer, (prevProps, nextProps) => {
  if (!equal(prevProps.result, nextProps.result)) return false;
  return true;
});

const PureDocumentHeader = ({
  title,
  kind,
  isStreaming,
}: {
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
}) => (
  <div className="p-4 border rounded-t-2xl flex flex-row gap-2 items-start sm:items-center justify-between dark:bg-muted border-b-0 dark:border-zinc-700">
    <div className="flex flex-row items-start sm:items-center gap-3">
      <div className="text-muted-foreground">
        {isStreaming ? (
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        ) : kind === "image" ? (
          <ImageIcon />
        ) : (
          <FileIcon />
        )}
      </div>
      <div className="-translate-y-1 sm:translate-y-0 font-medium">{title}</div>
    </div>
    <div className="w-8" />
  </div>
);

const DocumentHeader = memo(PureDocumentHeader, (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;

  return true;
});

const DocumentContent = ({ document }: { document: Document }) => {
  const { artifact } = useArtifact();

  const containerClassName = cn(
    "h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700",
    {
      "p-4 sm:p-8": document.kind === "text",
      "p-0": document.kind === "code",
    }
  );

  const commonProps = {
    content: document.content ?? "",
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: artifact.status,
    saveContent: () => {},
    suggestions: [],
  };

  return (
    <div className={containerClassName}>
      {document.kind === "text" ? (
        <Editor {...commonProps} onSaveContent={() => {}} />
      ) : document.kind === "code" ? (
        <div className="flex flex-1 relative w-full">
          <div className="absolute inset-0">
            <CodeEditor {...commonProps} onSaveContent={() => {}} />
          </div>
        </div>
      ) : document.kind === "sheet" ? (
        <div className="flex flex-1 relative size-full p-4">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === "image" ? (
        <ImageEditor
          title={document.title}
          content={document.content ?? ""}
          isCurrentVersion={true}
          currentVersionIndex={0}
          status={artifact.status}
          isInline={true}
        />
      ) : null}
    </div>
  );
};

const DocumentContainer = ({
  hitboxRef,
  result,
  setArtifact,
  title,
  kind,
  isStreaming,
  document,
}: {
  hitboxRef: React.RefObject<HTMLDivElement>;
  result: any;
  setArtifact: (
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact)
  ) => void;
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
  document: Document;
}) => {
  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer
        hitboxRef={hitboxRef}
        result={result}
        setArtifact={setArtifact}
      />
      <DocumentHeader title={title} kind={kind} isStreaming={isStreaming} />
      <DocumentContent document={document} />
    </div>
  );
};

const StepOnePreview = () => {
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

const TableComponent = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) => (
  <Table className="text-black dark:text-white">
    <TableHeader>
      <TableRow>
        {headers.map((h, i) => (
          <TableHead key={i} className="text-black dark:text-white">
            {h}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row, ri) => (
        <TableRow key={ri}>
          {row.map((cell, ci) => (
            <TableCell key={ci} className="text-black dark:text-white">
              {cell}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const SkeletonTables = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-6 w-full" />
    ))}
  </div>
);

const StepTwoPreview = () => {
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
                  description="Per 1 Januari 2025"
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

const StepThreePreview = () => {
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

const StepFourPreview = () => {
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
              <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💰</span>
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
            <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
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
              <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-white">📈</span>
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
                <div className="w-4 h-4 bg-green-600 rounded" />
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
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
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
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "85%" }}
                />
              </div>
            </div>
          </div>

          {/* Debt to Equity Ratio */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
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
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "45%" }}
                />
              </div>
            </div>
          </div>

          {/* ROE */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
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
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "78%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌟</span>
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
            <span className="text-lg mt-0.5">🔍</span>
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
