"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SetupData } from "./profile-setup";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface Step2CompanyDataProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
}

export function Step2CompanyData({ data, onUpdate }: Step2CompanyDataProps) {
  return (
    <div className="space-y-6">
      {/* A. Informasi Dasar Perusahaan */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          A. Informasi Dasar Perusahaan
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="companyName">Nama Perusahaan/Usaha</Label>
            <Input
              id="companyName"
              placeholder="Contoh: PT Jaya Abadi"
              value={data.companyName}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
            />
          </div>

          <div>
            <Label>Bentuk Badan Usaha</Label>
            <Select
              value={data.businessType}
              onValueChange={(value) => onUpdate({ businessType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih bentuk badan usaha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PT">Perseroan Terbatas (PT)</SelectItem>
                <SelectItem value="CV">
                  Commanditaire Vennootschap (CV)
                </SelectItem>
                <SelectItem value="Perorangan">Perorangan</SelectItem>
                <SelectItem value="BUT">Bentuk Usaha Tetap (BUT)</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="industry">Bidang Usaha (Sektor Industri)</Label>
            <Input
              id="industry"
              placeholder="Contoh: Perdagangan Ritel, Jasa Konsultasi IT, Manufaktur"
              value={data.industry}
              onChange={(e) => onUpdate({ industry: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address">Alamat Lengkap Perusahaan</Label>
            <Input
              id="address"
              placeholder="Sesuai dokumen resmi"
              value={data.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="operationDate">Tanggal Mulai Beroperasi</Label>
            <Input
              id="operationDate"
              type="date"
              value={data.operationDate}
              onChange={(e) => onUpdate({ operationDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* B. Informasi Perpajakan */}
      <div>
        <h3 className="text-lg font-semibold mb-4">B. Informasi Perpajakan</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="npwp">Nomor Pokok Wajib Pajak (NPWP)</Label>
            <Input
              id="npwp"
              placeholder="15 atau 16 digit"
              value={data.npwp}
              onChange={(e) => onUpdate({ npwp: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="efin">
              Nomor EFIN (Electronic Filing Identification Number)
            </Label>
            <Input
              id="efin"
              placeholder="Jika sudah ada, untuk keperluan pelaporan online"
              value={data.efin || ""}
              onChange={(e) => onUpdate({ efin: e.target.value })}
            />
          </div>

          <div>
            <Label>Status Pengusaha Kena Pajak (PKP)</Label>
            <RadioGroup
              value={data.pkpStatus}
              onValueChange={(value) =>
                onUpdate({ pkpStatus: value as "pkp" | "non-pkp" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pkp" id="pkp" />
                <Label htmlFor="pkp">Ya (PKP)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non-pkp" id="non-pkp" />
                <Label htmlFor="non-pkp">Tidak (Non-PKP)</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="fiscalYear">Periode Tahun Buku</Label>
            <Input
              id="fiscalYear"
              placeholder="Biasanya 1 Januari - 31 Desember"
              value={data.fiscalYear}
              onChange={(e) => onUpdate({ fiscalYear: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* C. Informasi Akuntansi */}
      <div>
        <h3 className="text-lg font-semibold mb-4">C. Informasi Akuntansi</h3>

        <div className="space-y-4">
          <div>
            <Label>Sistem Akuntansi Saat Ini</Label>
            <RadioGroup
              value={data.accountingSystem}
              onValueChange={(value) =>
                onUpdate({ accountingSystem: value as "manual" | "software" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Masih Manual / Excel</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="software" id="software" />
                <Label htmlFor="software">
                  Menggunakan Software Akuntansi (Contoh: Accurate, Jurnal,
                  Zahir)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Metode Pembukuan/Akuntansi</Label>
            <RadioGroup
              value={data.accountingMethod}
              onValueChange={(value) =>
                onUpdate({ accountingMethod: value as "accrual" | "cash" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accrual" id="accrual" />
                <div>
                  <Label htmlFor="accrual" className="font-medium">
                    Basis Akrual (Accrual Basis)
                  </Label>
                  <p className="text-sm text-gray-600">
                    Pendapatan/biaya diakui saat terjadi, bukan saat kas
                    diterima/dibayar (standar untuk PT).
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cash" id="cash" />
                <div>
                  <Label htmlFor="cash" className="font-medium">
                    Basis Kas (Cash Basis)
                  </Label>
                  <p className="text-sm text-gray-600">
                    Pendapatan/biaya diakui saat kas diterima/dibayar.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                placeholder="Nama bank"
                value={data.bankName}
                onChange={(e) => onUpdate({ bankName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Nomor Rekening</Label>
              <Input
                id="bankAccount"
                placeholder="Untuk referensi saat rekonsiliasi"
                value={data.bankAccount}
                onChange={(e) => onUpdate({ bankAccount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Mata Uang Fungsional</Label>
            <RadioGroup
              value={data.currency}
              onValueChange={(value) =>
                onUpdate({ currency: value as "IDR" | "USD" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="IDR" id="idr" />
                <Label htmlFor="idr">IDR (Rupiah)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd">USD (Dolar AS) atau lainnya</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Punya Daftar Akun (Chart of Accounts)?</Label>
            <RadioGroup
              value={data.hasChartOfAccounts ? "yes" : "no"}
              onValueChange={(value) =>
                onUpdate({ hasChartOfAccounts: value === "yes" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="coa-yes" />
                <Label htmlFor="coa-yes">
                  Ya, akan saya upload di step selanjutnya
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="coa-no" />
                <Label htmlFor="coa-no">Tidak, bantu saya membuatkannya</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
