"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { Bell, Building2, Ellipsis, Plus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator,
} from "@/components/ui/stepper";
import { Step3FileUpload } from "./step-3-file-upload";
import { Step2Preferences } from "./step-2-preferences";
import { Step1CompanyData } from "./step-1-company-data";

interface Company {
  id: string;
  name: string;
  period: string;
  lastAccessed: string;
}

interface ProfileSetupProps {
  session: Session;
}

export interface SetupData {
  profileName: string;
  companyName: string;
  address: string;
  npwp: string;
  reportPeriod: string;
  reportCurrency: string;

  additionalFeatures: {
    multiCurrency: boolean;
    costCenter: boolean;
    other: boolean;
  };
  returnValuation: "salePrice" | "costPrice";
  inventoryMethod: "fifo" | "weightedAverage";

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
  pkpStatus: "pkp" | "non-pkp";
  fiscalYear: string;
  accountingSystem: "manual" | "software";
  accountingMethod: "accrual" | "cash";
  bankName: string;
  bankAccount: string;
  currency: "IDR" | "USD";
  hasChartOfAccounts: boolean;
  uploadedFiles?: {
    name: string;
    type: string;
    size: number;
    lastModified: number;
  }[];
}

export function ProfileSetup({ session }: ProfileSetupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showStepper, setShowStepper] = useState(true); // Set to true for testing
  const [companies, setCompanies] = useState<Company[]>([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState<SetupData>({
    profileName: "",
    companyName: "",
    address: "",
    npwp: "",
    reportPeriod: "jan-dec",
    reportCurrency: "IDR",
    additionalFeatures: {
      multiCurrency: false,
      costCenter: false,
      other: false,
    },
    returnValuation: "salePrice",
    inventoryMethod: "fifo",
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
    pkpStatus: "non-pkp",
    fiscalYear: "1 Januari - 31 Desember",
    accountingSystem: "manual",
    accountingMethod: "accrual",
    bankName: "",
    bankAccount: "",
    currency: "IDR",
    hasChartOfAccounts: false,
  });

  useEffect(() => {
    const mockCompanies = [
      {
        id: "1",
        name: "PT Karya Konstruksi Prima - 202",
        period: "1 Jan – 31 Des 2024",
        lastAccessed: "2 jam lalu",
      },
      {
        id: "2",
        name: "PT Bangun Jaya Abadi - 101",
        period: "1 Feb – 31 Jan 2025",
        lastAccessed: "1 hari lalu",
      },
    ];
    setCompanies(mockCompanies);
  }, []);

  const steps = [
    {
      id: 1,
      title: "Data Perusahaan",
      description: "Informasi dasar perusahaan",
    },
    {
      id: 2,
      title: "Preferensi Akuntansi",
      description: "Konfigurasi fitur akuntansi",
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
      document.cookie =
        "profile-setup-completed=true; path=/; max-age=31536000";

      toast.success("Setup profil berhasil diselesaikan!");
      router.push("/home");
    } catch (error) {
      toast.error("Gagal menyimpan data profil");
    }
  };

  const updateSetupData = (updates: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    console.log("canProceed - currentStep:", currentStep);
    console.log("canProceed - setupData:", setupData);
    switch (currentStep) {
      case 1:
        const step1Valid =
          setupData.profileName &&
          setupData.companyName &&
          setupData.address &&
          setupData.npwp &&
          setupData.reportPeriod &&
          setupData.reportCurrency;
        console.log("canProceed - Step 1 Valid:", step1Valid);
        return step1Valid;
      case 2:
        const step2Valid =
          setupData.returnValuation && setupData.inventoryMethod;
        console.log("canProceed - Step 2 Valid:", step2Valid);
        return step2Valid;
      case 3:
        console.log("canProceed - Step 3 Valid: true");
        return true;
      default:
        console.log("canProceed - Default: false");
        return false;
    }
  };

  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <div className="flex flex-col mx-4 p-12">
      <div className="flex justify-between items-center">
        <Breadcrumb className="w-full">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
              const isLast = index === pathSegments.length - 1;
              return (
                <div key={segment} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{segment}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{segment}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex w-full items-center mt-2 mb-4">
          <Input placeholder="Search..." />
          <div className="rounded-lg p-3">
            <Bell color="#000" size={24} />
          </div>
        </div>
      </div>

      {!showStepper ? (
        <>
          <div className="flex justify-between">
            <div className="flex flex-col">
              <p className="text-[20px] font-bold text-slate-950">
                Pilih Ruang Kerja
              </p>
              <p className="text-slate-500 text-[12px]">
                Pilih profil perusahaan untuk mulai bekerja, atau buat yang baru
              </p>
            </div>
            <Button
              onClick={() => setShowStepper(true)}
              className="bg-green-900"
            >
              <Plus color="#fff" size={24} />
              <p className="text-white">Buat Profil Baru</p>
            </Button>
          </div>

          {companies.length === 0 ? (
            <div className="flex flex-col gap-3 items-center ">
              <Building2 size={24} color="#000" />
              <p>Belum Ada Ruang Kerja</p>
              <p>
                Kelola data dan analisis untuk tiap perusahaan. Buat profil
                pertama Anda untuk mulai
              </p>
              <Button
                onClick={() => setShowStepper(true)}
                className="bg-green-900"
              >
                <Plus color="#fff" size={24} />
                <p className="text-white">Buat Profil Baru</p>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {companies.map((company) => (
                <Card key={company.id} className="p-4 flex flex-col gap-7">
                  <div>
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-slate-950 text-[16px]">
                        {company.name}
                      </p>
                      <Ellipsis color="#000" size={24} />
                    </div>
                    <Badge className="bg-lime-50 mt-2">
                      Periode: {company.period}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-[10px]">
                    Terakhir diakses {company.lastAccessed}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Buat Profil Perusahaan Baru
            </h1>
          </div>

          {/* Stepper */}
          <div className="self-center object-center mb-8">
            <Stepper value={currentStep} className="w-full flex items-center">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <StepperItem
                    step={step.id}
                    completed={currentStep > step.id}
                    className="flex items-center"
                  >
                    <StepperTrigger className="flex items-center cursor-pointer">
                      <StepperIndicator>
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${
                    currentStep > step.id
                      ? "bg-[#A9E26F] text-[#054135]"
                      : currentStep === step.id
                        ? "bg-[#054135] text-white"
                        : "bg-gray-200 text-gray-500"
                  }
                `}
                        >
                          {currentStep > step.id ? "✓" : step.id}
                        </div>
                      </StepperIndicator>
                      <div className="ml-3">
                        <StepperTitle
                          className={`font-semibold ${
                            currentStep >= step.id
                              ? "text-[#0C1B33]"
                              : "text-gray-400"
                          }`}
                        >
                          {step.title}
                        </StepperTitle>
                      </div>
                    </StepperTrigger>
                  </StepperItem>

                  {/* Separator */}
                  {index < steps.length - 1 && (
                    <StepperSeparator
                      className={`flex-1 h-[2px] mx-2 ${
                        currentStep > step.id ? "bg-[#054135]" : "bg-gray-300"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </Stepper>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && (
                <Step1CompanyData data={setupData} onUpdate={updateSetupData} />
              )}
              {currentStep === 2 && (
                <Step2Preferences data={setupData} onUpdate={updateSetupData} />
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
          <div className="flex justify-end gap-4">
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
              className="bg-green-950 hover:bg-green-900 text-white"
            >
              {currentStep === 3 ? "Selesai" : "Selanjutnya"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
