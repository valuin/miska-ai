"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/toast";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";

import { login, type LoginActionState } from "../actions";
import { useSession } from "next-auth/react";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Kredensial tidak valid!",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Gagal memvalidasi data Anda!",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status, router, updateSession]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div className="h-dvh w-screen bg-background grid grid-cols-1 md:grid-cols-2">
      <div className="hidden lg:flex relative my-4">
        <Image
          src="/images/miska-mock.png"
          alt="Miska Dashboard Preview"
          fill
          className="object-contain rounded-2xl"
          priority
        />
      </div>

      {/* Kolom Kanan: Form Login (tidak berubah) */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md flex flex-col gap-10">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative w-full aspect-[16/2] overflow-hidden rounded-md">
              <Image
                src="/images/MISKA.png"
                alt="MISKA Logo"
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col gap-2 mt-7 w-full">
              <h3 className="text-xl text-start font-semibold dark:text-zinc-50">
                Masuk ke Akun Anda
              </h3>
              <p className="text-sm text-start text-gray-500 dark:text-zinc-400">
                Akses semua fitur dengan masuk menggunakan akun terdaftar
              </p>
            </div>
          </div>
          <AuthForm variant="login" action={handleSubmit} defaultEmail={email}>
            <SubmitButton isSuccessful={isSuccessful}>Masuk Akun</SubmitButton>
            <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
              {"Belum punya akun? "}
              <Link
                href="/register"
                className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
              >
                Daftar sekarang
              </Link>
            </p>
          </AuthForm>
        </div>
      </div>
    </div>
  );
}
