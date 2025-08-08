"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SetupData } from "./profile-setup";

interface Step2PreferencesProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
}

export function Step2Preferences({ data, onUpdate }: Step2PreferencesProps) {
  const handleFeatureChange = (
    feature: keyof SetupData["additionalFeatures"],
    checked: boolean
  ) => {
    const newFeatures = { ...data.additionalFeatures, [feature]: checked };
    onUpdate({ additionalFeatures: newFeatures });
  };

  return (
    <div className="space-y-8">
      {/* Bagian Fitur Tambahan */}
      <div>
        <h3 className="text-base font-semibold mb-4 text-gray-800">
          Fitur Tambahan
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="multiCurrency"
              checked={data.additionalFeatures.multiCurrency}
              onCheckedChange={(checked) =>
                handleFeatureChange("multiCurrency", checked as boolean)
              }
            />
            <Label htmlFor="multiCurrency" className="text-sm font-normal">
              Gunakan Multi Mata Uang
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="costCenter"
              checked={data.additionalFeatures.costCenter}
              onCheckedChange={(checked) =>
                handleFeatureChange("costCenter", checked as boolean)
              }
            />
            <Label htmlFor="costCenter" className="text-sm font-normal">
              Aktifkan Pusat Laba & Biaya
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="other"
              checked={data.additionalFeatures.other}
              onCheckedChange={(checked) =>
                handleFeatureChange("other", checked as boolean)
              }
            />
            <Label htmlFor="other" className="text-sm font-normal">
              (Fitur lainnya jika ada)
            </Label>
          </div>
        </div>
      </div>

      {/* Bagian Nilai Barang di Retur */}
      <div>
        <h3 className="text-base font-semibold mb-4 text-gray-800">
          Nilai barang yang di Retur berdasarkan:
        </h3>
        <RadioGroup
          value={data.returnValuation}
          onValueChange={(value) =>
            onUpdate({ returnValuation: value as "salePrice" | "costPrice" })
          }
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="salePrice" id="salePrice" />
            <Label htmlFor="salePrice" className="text-sm font-normal">
              Harga Jual
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="costPrice" id="costPrice" />
            <Label htmlFor="costPrice" className="text-sm font-normal">
              Biaya/Harga Pokok
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Bagian Metode Penilaian Persediaan */}
      <div>
        <h3 className="text-base font-semibold mb-4 text-gray-800">
          Metode Penilaian Persediaan
        </h3>
        <RadioGroup
          value={data.inventoryMethod}
          onValueChange={(value) =>
            onUpdate({
              inventoryMethod: value as "fifo" | "weightedAverage",
            })
          }
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="fifo" id="fifo" />
            <Label htmlFor="fifo" className="text-sm font-normal">
              Metode Penilaian Persediaan
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="weightedAverage" id="weightedAverage" />
            <Label htmlFor="weightedAverage" className="text-sm font-normal">
              Rata-rata Tertimbang (Weighted Average)
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
