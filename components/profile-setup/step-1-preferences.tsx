"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SetupData } from "./profile-setup";

interface Step1PreferencesProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
}

export function Step1Preferences({ data, onUpdate }: Step1PreferencesProps) {
  const [showAccountingDetails, setShowAccountingDetails] = useState(
    data.services.accounting
  );
  const [showTaxDetails, setShowTaxDetails] = useState(data.services.tax);
  const [showAuditDetails, setShowAuditDetails] = useState(data.services.audit);

  const handleServiceChange = (
    service: keyof SetupData["services"],
    checked: boolean
  ) => {
    const newServices = { ...data.services, [service]: checked };
    onUpdate({ services: newServices });

    // Show/hide detail sections
    if (service === "accounting") setShowAccountingDetails(checked);
    if (service === "tax") setShowTaxDetails(checked);
    if (service === "audit") setShowAuditDetails(checked);
  };

  return (
    <div className="space-y-6">
      {/* Main Services */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Pilih Layanan Utama yang Dibutuhkan
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="accounting"
              checked={data.services.accounting}
              onCheckedChange={(checked) =>
                handleServiceChange("accounting", checked as boolean)
              }
            />
            <Label htmlFor="accounting" className="text-base">
              💰 Layanan Akuntansi
            </Label>
          </div>
          <p className="text-sm text-gray-600 ml-6">
            Untuk pencatatan transaksi harian, pembuatan laporan keuangan, dan
            manajemen utang-piutang.
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax"
              checked={data.services.tax}
              onCheckedChange={(checked) =>
                handleServiceChange("tax", checked as boolean)
              }
            />
            <Label htmlFor="tax" className="text-base">
              📊 Layanan Perpajakan
            </Label>
          </div>
          <p className="text-sm text-gray-600 ml-6">
            Untuk perhitungan, pelaporan pajak bulanan/tahunan, dan konsultasi
            kewajiban pajak.
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="audit"
              checked={data.services.audit}
              onCheckedChange={(checked) =>
                handleServiceChange("audit", checked as boolean)
              }
            />
            <Label htmlFor="audit" className="text-base">
              🔍 Layanan Audit
            </Label>
          </div>
          <p className="text-sm text-gray-600 ml-6">
            Untuk pemeriksaan internal, validasi transaksi, dan pengecekan
            kepatuhan (compliance).
          </p>
        </div>
      </div>

      {/* Accounting Details */}
      {showAccountingDetails && (
        <div className="border-l-4 border-blue-500 pl-4 space-y-4">
          <h4 className="font-semibold text-blue-700">
            Fokus Spesifik Akuntansi
          </h4>

          <div>
            <Label>Frekuensi Laporan Keuangan</Label>
            <Select
              value={data.accountingPreferences?.frequency || "monthly"}
              onValueChange={(value) =>
                onUpdate({
                  accountingPreferences: {
                    ...data.accountingPreferences,
                    frequency: value as "monthly" | "quarterly" | "yearly",
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="quarterly">Kuartalan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Laporan yang Diinginkan</Label>
            <div className="space-y-2 mt-2">
              {["Laporan Laba Rugi", "Neraca", "Arus Kas"].map((report) => (
                <div key={report} className="flex items-center space-x-2">
                  <Checkbox
                    id={report}
                    checked={
                      data.accountingPreferences?.reports?.includes(report) ||
                      false
                    }
                    onCheckedChange={(checked) => {
                      const currentReports =
                        data.accountingPreferences?.reports || [];
                      const newReports = checked
                        ? [...currentReports, report]
                        : currentReports.filter((r) => r !== report);
                      onUpdate({
                        accountingPreferences: {
                          ...data.accountingPreferences,
                          reports: newReports,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={report} className="text-sm">
                    {report}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Tugas Tambahan</Label>
            <div className="space-y-2 mt-2">
              {[
                "Monitoring Piutang",
                "Monitoring Utang",
                "Rekonsiliasi Bank",
              ].map((task) => (
                <div key={task} className="flex items-center space-x-2">
                  <Checkbox
                    id={task}
                    checked={
                      data.accountingPreferences?.additionalTasks?.includes(
                        task
                      ) || false
                    }
                    onCheckedChange={(checked) => {
                      const currentTasks =
                        data.accountingPreferences?.additionalTasks || [];
                      const newTasks = checked
                        ? [...currentTasks, task]
                        : currentTasks.filter((t) => t !== task);
                      onUpdate({
                        accountingPreferences: {
                          ...data.accountingPreferences,
                          additionalTasks: newTasks,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={task} className="text-sm">
                    {task}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tax Details */}
      {showTaxDetails && (
        <div className="border-l-4 border-green-500 pl-4 space-y-4">
          <h4 className="font-semibold text-green-700">Fokus Spesifik Pajak</h4>

          <div>
            <Label>Jenis Pajak yang ingin Dikelola</Label>
            <div className="space-y-2 mt-2">
              {[
                "PPh 21 (Karyawan)",
                "PPh 23 (Jasa)",
                "PPh Final (UMKM/Sewa)",
                "PPN (Pajak Pertambahan Nilai)",
                "SPT Badan Tahunan",
              ].map((taxType) => (
                <div key={taxType} className="flex items-center space-x-2">
                  <Checkbox
                    id={taxType}
                    checked={
                      data.taxPreferences?.taxTypes?.includes(taxType) || false
                    }
                    onCheckedChange={(checked) => {
                      const currentTypes = data.taxPreferences?.taxTypes || [];
                      const newTypes = checked
                        ? [...currentTypes, taxType]
                        : currentTypes.filter((t) => t !== taxType);
                      onUpdate({
                        taxPreferences: {
                          ...data.taxPreferences,
                          taxTypes: newTypes,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={taxType} className="text-sm">
                    {taxType}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Frekuensi Pelaporan Pajak</Label>
            <RadioGroup
              value={data.taxPreferences?.frequency || "monthly"}
              onValueChange={(value) =>
                onUpdate({
                  taxPreferences: {
                    ...data.taxPreferences,
                    frequency: value as "monthly" | "yearly",
                  },
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="tax-monthly" />
                <Label htmlFor="tax-monthly">Bulanan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="tax-yearly" />
                <Label htmlFor="tax-yearly">Tahunan</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Audit Details */}
      {showAuditDetails && (
        <div className="border-l-4 border-purple-500 pl-4 space-y-4">
          <h4 className="font-semibold text-purple-700">
            Fokus Spesifik Audit
          </h4>

          <div>
            <Label>Area Fokus Audit</Label>
            <div className="space-y-2 mt-2">
              {[
                "Audit Internal (Kesesuaian Transaksi)",
                "Audit Kepatuhan (Compliance Check)",
                "Audit Operasional (Efisiensi Proses)",
              ].map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={area}
                    checked={
                      data.auditPreferences?.focusAreas?.includes(area) || false
                    }
                    onCheckedChange={(checked) => {
                      const currentAreas =
                        data.auditPreferences?.focusAreas || [];
                      const newAreas = checked
                        ? [...currentAreas, area]
                        : currentAreas.filter((a) => a !== area);
                      onUpdate({
                        auditPreferences: {
                          ...data.auditPreferences,
                          focusAreas: newAreas,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={area} className="text-sm">
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Automation Level */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Tingkat Otomatisasi yang Diinginkan
        </h3>
        <RadioGroup
          value={data.automationLevel}
          onValueChange={(value) =>
            onUpdate({
              automationLevel: value as "monitoring" | "drafting" | "full",
            })
          }
        >
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monitoring" id="monitoring" />
              <div>
                <Label htmlFor="monitoring" className="font-medium">
                  Monitoring & Insight
                </Label>
                <p className="text-sm text-gray-600">
                  AI hanya memberikan ringkasan, analisis, dan pengingat.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="drafting" id="drafting" />
              <div>
                <Label htmlFor="drafting" className="font-medium">
                  Drafting & Asistensi
                </Label>
                <p className="text-sm text-gray-600">
                  AI membantu membuat draf laporan (keuangan/pajak) dan email
                  yang perlu direview pengguna.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full" id="full" />
              <div>
                <Label htmlFor="full" className="font-medium">
                  Otomatisasi Penuh
                </Label>
                <p className="text-sm text-gray-600">
                  AI secara otomatis mengirimkan laporan atau melakukan entri
                  jurnal (membutuhkan integrasi lebih dalam dan kepercayaan
                  user).
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
