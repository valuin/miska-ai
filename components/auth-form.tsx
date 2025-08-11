"use client";

import Form from "next/form";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AuthForm({
  action,
  children,
  variant,
  defaultEmail = "",
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  variant: "login" | "register";
  defaultEmail?: string;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4">
      {variant === "register" && (
        <div className="flex flex-col gap-4">
          <Label htmlFor="name" className="text-slate-950 font-bold">
            Nama Lengkap
          </Label>
          <Input
            id="name"
            name="name"
            className="bg-white/10 border-zinc-600 text-white placeholder:text-zinc-500 text-md md:text-sm"
            type="text"
            placeholder="Masukkan nama lengkap Anda"
            required
          />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Label htmlFor="email" className="text-slate-950 font-bold">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          className="bg-white/10 border-zinc-600 text-white placeholder:text-zinc-500 text-md md:text-sm"
          type="email"
          placeholder="Masukkan alamat email Anda"
          autoComplete="email"
          required
          autoFocus={variant === "login"}
          defaultValue={defaultEmail}
        />
      </div>

      {/* Field Password (ada di kedua form) */}
      <div className="flex flex-col gap-4">
        <Label htmlFor="password" className="text-slate-950 font-bold">
          Kata Sandi
        </Label>
        <Input
          id="password"
          name="password"
          className="bg-white/10 border-zinc-600 text-white placeholder:text-zinc-500 text-md md:text-sm"
          type="password"
          placeholder="Masukkan kata sandi Anda"
          required
        />
      </div>

      {/* Field yang hanya muncul di form registrasi */}
      {variant === "register" && (
        <>
          <div className="flex flex-col gap-4">
            <Label
              htmlFor="confirmPassword"
              className="text-slate-950 font-bold"
            >
              Konfirmasi Kata Sandi
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              className="bg-white/10 border-zinc-600 text-white placeholder:text-zinc-500 text-md md:text-sm"
              type="password"
              placeholder="Masukkan ulang kata sandi Anda"
              required
            />
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="terms"
              name="terms"
              required
              className="border-zinc-500 data-[state=checked]:bg-teal-500"
            />
            <label
              htmlFor="terms"
              className="text-sm text-zinc-400 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi
            </label>
          </div>
        </>
      )}

      {children}
    </Form>
  );
}
