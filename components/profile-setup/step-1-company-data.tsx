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

export interface SetupData {
  profileName: string;
  companyName: string;
  address: string;
  npwp: string;
  reportPeriod: string;
  reportCurrency: string;
}

interface Step1CompanyDataProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
}

export function Step1CompanyData({ data, onUpdate }: Step1CompanyDataProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      <div>
        <Label htmlFor="profileName">Nama Profil</Label>
        <Input
          id="profileName"
          placeholder="Cth: PT Sejahtera Abadi - 2024"
          value={data.profileName}
          onChange={(e) => onUpdate({ profileName: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="npwp">NPWP Perusahaan</Label>
        <Input
          id="npwp"
          placeholder="00.000.000.0-000.000"
          value={data.npwp}
          onChange={(e) => onUpdate({ npwp: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="companyName">Nama Resmi Perusahaan</Label>
        <Input
          id="companyName"
          placeholder="Masukkan nama sesuai akta"
          value={data.companyName}
          onChange={(e) => onUpdate({ companyName: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="reportPeriod">Periode Laporan</Label>
        <Select
          value={data.reportPeriod}
          onValueChange={(value) => onUpdate({ reportPeriod: value })}
        >
          <SelectTrigger id="reportPeriod">
            <SelectValue placeholder="Pilih Periode Laporan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jan-dec">Januari - Desember</SelectItem>
            <SelectItem value="jul-jun">Juli - Juni</SelectItem>
            <SelectItem value="custom">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="address">Alamat Perusahaan</Label>
        <Input
          id="address"
          placeholder="Masukkan alamat lengkap"
          value={data.address}
          onChange={(e) => onUpdate({ address: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="reportCurrency">Mata Uang Pelaporan</Label>
        <Select
          value={data.reportCurrency}
          onValueChange={(value) => onUpdate({ reportCurrency: value })}
        >
          <SelectTrigger id="reportCurrency">
            <SelectValue placeholder="Pilih Mata Uang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IDR">IDR - Rupiah</SelectItem>
            <SelectItem value="USD">USD - Dolar AS</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
