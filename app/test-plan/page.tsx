'use client';

import { PlanDisplay } from '@/components/plan-display';

export default function TestPlanPage() {
  // Contoh data dengan files untuk menguji tampilan
  const planData = {
    todos: [
      {
        title: 'Analisis Data Keuangan',
        description: 'Menganalisis laporan keuangan perusahaan untuk periode 2023',
        files: [
          {
            name: 'Laporan Keuangan 2023.pdf',
            size: '2.5 MB',
            type: 'pdf' as const
          },
          {
            name: 'Data Analisis.xls',
            size: '1.8 MB',
            type: 'xls' as const
          }
        ]
      },
      {
        title: 'Persiapan Presentasi',
        description: 'Menyiapkan slide presentasi untuk meeting dengan stakeholder',
        files: [
          {
            name: 'Presentasi Meeting.doc',
            size: '3.2 MB',
            type: 'doc' as const
          }
        ]
      },
      {
        title: 'Review Dokumen Legal',
        description: 'Memeriksa dokumen legal untuk kepatuhan regulasi',
        files: [
          {
            name: 'Dokumen Legal.pdf',
            size: '4.7 MB',
            type: 'pdf' as const
          },
          {
            name: 'Checklist Regulasi.xls',
            size: '0.8 MB',
            type: 'xls' as const
          },
          {
            name: 'Template Kontrak.doc',
            size: '1.5 MB',
            type: 'doc' as const
          }
        ]
      }
    ]
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Test Plan Display</h1>
      <PlanDisplay data={planData} />
    </div>
  );
}