'use client';
import * as React from 'react';

import {
  memo,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from 'react';
import { SpreadsheetEditor } from './sheet-editor';
import { ImageEditor } from './image-editor';
import { useMessageCountStore } from './chat-with-preview';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Skeleton } from './ui/skeleton';
import type { ArtifactKind, UIArtifact } from './artifact';
import { FileIcon, FullscreenIcon, ImageIcon, LoaderIcon } from './icons';
import { cn, fetcher } from '@/lib/utils';
import type { Document } from '@/lib/db/schema';
import { InlineDocumentSkeleton } from './document-skeleton';
import useSWR from 'swr';
import { Editor } from './text-editor';
import { DocumentToolCall, DocumentToolResult } from './document';
import { CodeEditor } from './code-editor';
import { useArtifact } from '@/hooks/use-artifact';
import equal from 'fast-deep-equal';
import { useDocumentPreviewStore } from '@/lib/store/document-preview-store';

interface DocumentPreviewProps {
  isReadonly: boolean;
  result?: any;
  args?: any;
}

// Small helpers to keep DocumentPreview lean and modular
const renderPreviewForMessageCount = (count?: number) => {
  if (!count || count < 1) return null;
  if (count === 2) return <StepTwoPreview />;
  if (count === 3) return <StepThreePreview />;
  return <StepOnePreview />;
};

const getDerivedDocument = (
  artifact: ReturnType<typeof useArtifact>['artifact'],
  previewDocument: Document | undefined | null,
): Document | null => {
  if (previewDocument) return previewDocument;
  if (artifact.status === 'streaming') {
    return {
      title: artifact.title,
      kind: artifact.kind,
      content: artifact.content,
      id: artifact.documentId,
      createdAt: new Date(),
      userId: 'noop',
    };
  }
  return null;
};

const useSyncBoundingBox = (
  artifact: ReturnType<typeof useArtifact>['artifact'],
  setArtifact: ReturnType<typeof useArtifact>['setArtifact'],
  hitboxRef: React.RefObject<HTMLDivElement>,
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
  }, [artifact.documentId, setArtifact, hitboxRef]);
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

  // Keep bounding box in sync when artifact visibility changes
  useSyncBoundingBox(artifact, setArtifact, hitboxRef);

  // Early return for message count guided previews
  const previewNode = renderPreviewForMessageCount(messageCount);
  if (previewNode) return previewNode;

  // Show tool result / tool call overlays while artifact is visible
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

  // Loading state for server documents fetch
  if (isDocumentsFetching) {
    const kind: ArtifactKind = (result?.kind ?? args?.kind ?? artifact.kind) as ArtifactKind;
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
      isStreaming={artifact.status === 'streaming'}
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
    {artifactKind === 'image' ? (
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
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void;
}) => {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      const boundingBox = event.currentTarget.getBoundingClientRect();

      setArtifact((artifact) =>
        artifact.status === 'streaming'
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
            },
      );
    },
    [setArtifact, result],
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
        ) : kind === 'image' ? (
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
    'h-[257px] overflow-y-scroll border rounded-b-2xl dark:bg-muted border-t-0 dark:border-zinc-700',
    {
      'p-4 sm:p-8': document.kind === 'text',
      'p-0': document.kind === 'code',
    },
  );

  const commonProps = {
    content: document.content ?? '',
    isCurrentVersion: true,
    currentVersionIndex: 0,
    status: artifact.status,
    saveContent: () => {},
    suggestions: [],
  };

  return (
    <div className={containerClassName}>
      {document.kind === 'text' ? (
        <Editor {...commonProps} onSaveContent={() => {}} />
      ) : document.kind === 'code' ? (
        <div className="flex flex-1 relative w-full">
          <div className="absolute inset-0">
            <CodeEditor {...commonProps} onSaveContent={() => {}} />
          </div>
        </div>
      ) : document.kind === 'sheet' ? (
        <div className="flex flex-1 relative size-full p-4">
          <div className="absolute inset-0">
            <SpreadsheetEditor {...commonProps} />
          </div>
        </div>
      ) : document.kind === 'image' ? (
        <ImageEditor
          title={document.title}
          content={document.content ?? ''}
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
    updaterFn: UIArtifact | ((currentArtifact: UIArtifact) => UIArtifact),
  ) => void;
  title: string;
  kind: ArtifactKind;
  isStreaming: boolean;
  document: Document;
}) => {
  return (
    <div className="relative w-full cursor-pointer">
      <HitboxLayer hitboxRef={hitboxRef} result={result} setArtifact={setArtifact} />
      <DocumentHeader title={title} kind={kind} isStreaming={isStreaming} />
      <DocumentContent document={document} />
    </div>
  );
};

const StepOnePreview = () => {
  console.log("[StepOnePreview] Mounted");
  const [activeTab, setActiveTab] = React.useState<'jurnal' | 'buku' | 'neraca'>('jurnal');
  const { setDocumentPreview } = useDocumentPreviewStore();
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);
 
  const jurnalData = [
    { tanggal: '2025-01-01', noAkun: '1101', namaAkun: 'Kas', debit: '10.000.000', kredit: '', keterangan: 'Setoran modal awal' },
    { tanggal: '2025-01-01', noAkun: '3101', namaAkun: 'Modal', debit: '', kredit: '10.000.000', keterangan: 'Setoran modal awal' },
  ];
  const bukuData = [
    { tanggal: '2025-01-01', ref: '001', keterangan: 'Setoran modal', debit: '10.000.000', kredit: '', saldo: '10.000.000' },
    { tanggal: '2025-01-05', ref: '002', keterangan: 'Pembelian alat', debit: '', kredit: '2.000.000', saldo: '8.000.000' },
  ];
  const neracaData = [
    { noAkun: '1101', namaAkun: 'Kas', debit: '8.000.000', kredit: '' },
    { noAkun: '1201', namaAkun: 'Peralatan', debit: '2.000.000', kredit: '' },
    { noAkun: '3101', namaAkun: 'Modal', debit: '', kredit: '10.000.000' },
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
  }, [setDocumentPreview]);

  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        <button onClick={() => setActiveTab('jurnal')} className={`px-4 py-2 ${activeTab==='jurnal'?'border-b-2 border-primary':''}`}>Jurnal Umum</button>
        <button onClick={() => setActiveTab('buku')} className={`px-4 py-2 ${activeTab==='buku'?'border-b-2 border-primary':''}`}>Buku Besar</button>
        <button onClick={() => setActiveTab('neraca')} className={`px-4 py-2 ${activeTab==='neraca'?'border-b-2 border-primary':''}`}>Neraca Saldo</button>
      </div>
 
      {loading ? (
        <SkeletonTables />
      ) : activeTab === 'jurnal' ? (
        <TableComponent headers={['Tanggal','No. Akun','Nama Akun','Debit','Kredit','Keterangan']} rows={jurnalData.map(d=>[d.tanggal,d.noAkun,d.namaAkun,d.debit,d.kredit,d.keterangan])} />
      ) : activeTab === 'buku' ? (
        <TableComponent headers={['Tanggal','No. Referensi','Keterangan','Debit','Kredit','Saldo']} rows={bukuData.map(d=>[d.tanggal,d.ref,d.keterangan,d.debit,d.kredit,d.saldo])} />
      ) : (
        <TableComponent headers={['No. Akun','Nama Akun','Debit','Kredit']} rows={neracaData.map(d=>[d.noAkun,d.namaAkun,d.debit,d.kredit])} />
      )}
    </div>
  );
};
 
const TableComponent = ({headers, rows}:{headers:string[],rows:string[][]}) => (
  <Table className="text-black dark:text-white">
    <TableHeader>
      <TableRow>
        {headers.map((h,i)=>(<TableHead key={i} className="text-black dark:text-white">{h}</TableHead>))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row,ri)=>(
        <TableRow key={ri}>
          {row.map((cell,ci)=>(<TableCell key={ci} className="text-black dark:text-white">{cell}</TableCell>))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
 
const SkeletonTables = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_,i)=>(
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
    ["2025-01-01","Pembelian Barang A","100","10.000","","","100","1.000.000"],
    ["2025-01-03","Penjualan","","","60","10.000","40","400.000"],
  ];
  const fifoJurnal: string[][] = [
    ["Persediaan Barang","1.000.000"],
    ["    Kas","1.000.000"],
    ["(Pembelian Barang A)",""],
    ["Harga Pokok Penjualan","600.000"],
    ["    Persediaan Barang","600.000"],
    ["(Pengurangan persediaan karena penjualan FIFO)",""],
  ];
  const penyusutanTable: string[][] = [
    ["Laptop","12.000.000","4","2.000.000","2.500.000","208.333"],
  ];
  const penyusutanJurnal: string[][] = [
    ["Beban Penyusutan","208.333"],
    ["    Akumulasi Penyusutan","208.333"],
    ["(Pencatatan penyusutan bulan Januari)",""],
  ];
  const penyesuaianJurnal: string[][] = [
    ["Beban Sewa Dibayar Di Muka","500.000"],
    ["    Sewa Dibayar Di Muka","500.000"],
    ["(Alokasi biaya sewa selama bulan berjalan)",""],
    ["Pendapatan Diterima Di Muka","1.000.000"],
    ["    Pendapatan","1.000.000"],
    ["(Pengakuan pendapatan yang sudah diperoleh)",""],
  ];
  const rekonsiliasiBank1: string[][] = [
    ["Saldo menurut bank","10.000.000"],
    ["(+) Setoran dalam perjalanan","1.000.000"],
    ["(-) Cek yang belum dicairkan","500.000"],
    ["(=) Saldo yang disesuaikan (bank)","10.500.000"],
  ];
  const rekonsiliasiBank2: string[][] = [
    ["Saldo menurut buku perusahaan","10.000.000"],
    ["(+) Bunga bank","500.000"],
    ["(-) Biaya administrasi bank","100.000"],
    ["(=) Saldo yang disesuaikan (buku)","10.400.000"],
  ];
  const rekonsiliasiJurnal: string[][] = [
    ["Kas","500.000"],
    ["    Pendapatan Bunga","500.000"],
    ["(Pencatatan bunga bank)",""],
    ["Beban Administrasi","100.000"],
    ["    Kas","100.000"],
    ["(Pencatatan biaya administrasi bank)",""],
  ];
  const neracaPenyesuaian: string[][] = [
    ["1101","Kas","10.400.000",""],
    ["1201","Peralatan","12.000.000",""],
    ["1202","Akumulasi Penyusutan","","208.333"],
    ["3101","Modal","","10.000.000"],
    ["4101","Pendapatan","","1.000.000"],
    ["5101","Beban Penyusutan","208.333",""],
    ["5102","Beban Administrasi Bank","100.000",""],
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
        {tabs.map((tab,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)} className={`px-4 py-2 whitespace-nowrap ${activeTab===i?'border-b-2 border-primary':''}`}>{tab}</button>
        ))}
      </div>
      {loading ? <SkeletonTables/> : (
        <>
          {activeTab===0 && (
            <>
              <TableComponent headers={["Tanggal","Keterangan","Qty Masuk","Harga Masuk","Qty Keluar","Harga Keluar","Sisa Qty","Nilai Persediaan"]} rows={fifoTable}/>
              <TableComponent headers={["Akun","Jumlah"]} rows={fifoJurnal}/>
            </>
          )}
          {activeTab===1 && (
            <>
              <TableComponent headers={["Aset","Harga Perolehan","Umur (thn)","Nilai Sisa","Penyusutan/Tahun","Penyusutan/Bulan"]} rows={penyusutanTable}/>
              <TableComponent headers={["Akun","Jumlah"]} rows={penyusutanJurnal}/>
            </>
          )}
          {activeTab===2 && (
            <TableComponent headers={["Akun","Jumlah"]} rows={penyesuaianJurnal}/>
          )}
          {activeTab===3 && (
            <>
              <TableComponent headers={["Keterangan","Jumlah"]} rows={rekonsiliasiBank1}/>
              <TableComponent headers={["Keterangan","Jumlah"]} rows={rekonsiliasiBank2}/>
              <TableComponent headers={["Akun","Jumlah"]} rows={rekonsiliasiJurnal}/>
            </>
          )}
          {activeTab===4 && (
            <TableComponent headers={["No. Akun","Nama Akun","Debit","Kredit"]} rows={neracaPenyesuaian}/>
          )}
          {activeTab===5 && (
            <TableComponent headers={["No. Akun","Nama Akun","Debit","Kredit"]} rows={neracaPost}/>
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
    ["Modal Awal","100.000.000","-","100.000.000"],
    ["Laba Bersih","-","30.000.000","30.000.000"],
    ["Prive","-","(5.000.000)","(5.000.000)"],
    ["Ekuitas Akhir","","","125.000.000"]
  ];

  const posisiKeuangan = [
    ["Aset","Kas","50.000.000"],
    ["Aset","Piutang","20.000.000"],
    ["Aset","Peralatan (net)","40.000.000"],
    ["Liabilitas","Utang Usaha","10.000.000"],
    ["Ekuitas","Modal Akhir","100.000.000"],
    ["Total","","150.000.000"],
  ];

  const arusKas = [
    ["Operasional","Kas dari pelanggan","70.000.000"],
    ["Operasional","Pembayaran gaji","(20.000.000)"],
    ["Investasi","Pembelian aset tetap","(10.000.000)"],
    ["Pendanaan","Penambahan modal","30.000.000"],
    ["Saldo Akhir Kas","","70.000.000"],
  ];

  const catatan = [
    ["Metode penyusutan","Garis lurus"],
    ["Pengakuan pendapatan","Saat jasa diselesaikan"],
    ["Estimasi masa manfaat aset tetap","..."],
    ["Rincian saldo kas dan piutang","..."],
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
        {tabs.map((tab,i)=>(
          <button key={i} onClick={()=>setActiveTab(i)} className={`px-4 py-2 whitespace-nowrap ${activeTab===i?'border-b-2 border-primary':''}`}>{tab}</button>
        ))}
      </div>
      {loading ? <SkeletonTables/> : (
        <>
          {activeTab===0 && (
            <TableComponent headers={["Kategori","Nama Akun","Jumlah (Rp)"]} rows={labaRugi}/>
          )}
          {activeTab===1 && (
            <TableComponent headers={["Komponen Ekuitas","Saldo Awal","Perubahan","Saldo Akhir"]} rows={perubahanEkuitas}/>
          )}
          {activeTab===2 && (
            <TableComponent headers={["Kategori","Nama Akun","Jumlah (Rp)"]} rows={posisiKeuangan}/>
          )}
          {activeTab===3 && (
            <TableComponent headers={["Aktivitas","Deskripsi","Jumlah (Rp)"]} rows={arusKas}/>
          )}
          {activeTab===4 && (
            <TableComponent headers={["Judul","Detail"]} rows={catatan}/>
          )}
        </>
      )}
    </div>
  );
};
