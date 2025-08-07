"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Step1Preferences } from "./step-1-preferences";
import { Step2CompanyData } from "./step-2-company-data";
import { Step3FileUpload } from "./step-3-file-upload";

interface ProfileSetupProps {
  session: Session;
}

export interface SetupData {
  // Step 1: Preferences
  services: {
    accounting: boolean;
    tax: boolean;
    audit: boolean;
  };
  accountingPreferences: {
    frequency: "monthly" | "quarterly" | "yearly";
    reports: string[];
    additionalTasks: string[];
  };
  taxPreferences: {
    taxTypes: string[];
    frequency: "monthly" | "yearly";
  };
  auditPreferences: {
    focusAreas: string[];
  };
  automationLevel: "monitoring" | "drafting" | "full";

  // Step 2: Company Data
  companyName: string;
  businessType: string;
  industry: string;
  address: string;
  operationDate: string;
  npwp: string;
  efin?: string;
  pkpStatus: "pkp" | "non-pkp";
  fiscalYear: string;
  accountingSystem: "manual" | "software";
  accountingMethod: "accrual" | "cash";
  bankName: string;
  bankAccount: string;
  currency: "IDR" | "USD";
  hasChartOfAccounts: boolean;
}

export function ProfileSetup({ session }: ProfileSetupProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    services: {
      accounting: false,
      tax: false,
      audit: false,
    },
    accountingPreferences: {
      frequency: "monthly",
      reports: [],
      additionalTasks: [],
    },
    taxPreferences: {
      taxTypes: [],
      frequency: "monthly",
    },
    auditPreferences: {
      focusAreas: [],
    },
    automationLevel: "monitoring",
    companyName: "",
    businessType: "",
    industry: "",
    address: "",
    operationDate: "",
    npwp: "",
    pkpStatus: "non-pkp",
    fiscalYear: "1 Januari - 31 Desember",
    accountingSystem: "manual",
    accountingMethod: "accrual",
    bankName: "",
    bankAccount: "",
    currency: "IDR",
    hasChartOfAccounts: false,
  });

  const steps = [
    {
      id: 1,
      title: "Preferensi & Kebutuhan",
      description: "Pilih layanan yang dibutuhkan",
    },
    {
      id: 2,
      title: "Data Perusahaan",
      description: "Informasi dasar perusahaan",
    },
    { id: 3, title: "Upload Dokumen", description: "Upload file pendukung" },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save setup data to database/cookie
      document.cookie =
        "profile-setup-completed=true; path=/; max-age=31536000";

      toast.success("Setup profil berhasil diselesaikan!");
      router.push("/chat");
    } catch (error) {
      toast.error("Gagal menyimpan data profil");
    }
  };

  const updateSetupData = (updates: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          setupData.services.accounting ||
          setupData.services.tax ||
          setupData.services.audit
        );
      case 2:
        return (
          setupData.companyName && setupData.businessType && setupData.npwp
        );
      case 3:
        return true; // File upload is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Setup Profil Finance AI
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mari kita konfigurasi AI sesuai kebutuhan bisnis Anda
            </p>
          </div>

          {/* Stepper */}
          <div className="mb-8">
            <Stepper value={currentStep} className="w-full">
              {steps.map((step, index) => (
                <StepperItem
                  key={step.id}
                  step={step.id}
                  completed={currentStep > step.id}
                >
                  <StepperTrigger className="cursor-pointer">
                    <StepperIndicator>
                      <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center">
                        {currentStep > step.id ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-600">{step.id}</span>
                        )}
                      </div>
                    </StepperIndicator>
                    <div className="ml-4">
                      <StepperTitle>{step.title}</StepperTitle>
                      <StepperDescription>
                        {step.description}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                  {index < steps.length - 1 && <StepperSeparator />}
                </StepperItem>
              ))}
            </Stepper>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">
                  {currentStep === 1 && "⚙️"}
                  {currentStep === 2 && "📊"}
                  {currentStep === 3 && "📂"}
                </span>
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <Step1Preferences data={setupData} onUpdate={updateSetupData} />
              )}
              {currentStep === 2 && (
                <Step2CompanyData data={setupData} onUpdate={updateSetupData} />
              )}
              {currentStep === 3 && (
                <Step3FileUpload
                  data={setupData}
                  onUpdate={updateSetupData}
                  session={session}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Sebelumnya
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === 3 ? "Selesai" : "Selanjutnya"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
