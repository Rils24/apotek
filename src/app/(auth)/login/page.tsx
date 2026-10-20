'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { signIn } from '@/server/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pill, Mail, Lock, AlertCircle, Building2, ShieldCheck, UserCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Suspense } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'account_disabled') {
      setErrorMessage('Akun Anda dinonaktifkan. Silakan hubungi pemilik apotek.');
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    startTransition(async () => {
      const res = await signIn(formData);
      if (res?.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
      }
    });
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-zinc-50">
      {/* Left visual column */}
      <div className="hidden md:flex md:w-1/2 bg-teal-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background decorative patterns */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-teal-800/40 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 rounded-full bg-teal-700/30 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-md">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white">ApoTech</span>
              <span className="text-teal-300 text-xs block font-medium">Sistem POS & Manajemen Apotek</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto py-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-800/80 text-teal-200 border border-teal-700 mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Standar Operasional Farmasi Indonesia
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-4">
            Kelola Transaksi & Stok Obat dengan Cepat, Akurat, dan Patuh Regulasi.
          </h1>
          <p className="text-teal-200/80 text-sm leading-relaxed mb-8">
            Dirancang khusus untuk ritel farmasi independen. Dilengkapi FEFO otomatis, proteksi HPP kasir, rekonsiliasi kas shift, pencatatan obat keras & narkotika.
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs text-teal-100">
            <div className="p-3.5 rounded-lg bg-teal-800/50 border border-teal-700/50 backdrop-blur-xs">
              <span className="font-semibold block text-white mb-1">FEFO Otomatis</span>
              Memilih batch terdekat kadaluarsa tanpa salah hitung.
            </div>
            <div className="p-3.5 rounded-lg bg-teal-800/50 border border-teal-700/50 backdrop-blur-xs">
              <span className="font-semibold block text-white mb-1">Kasir & Pemilik</span>
              Role ketat mencegah kasir mengintip modal & HPP.
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-teal-300/70 flex items-center justify-between border-t border-teal-800 pt-6">
          <span>&copy; {new Date().getFullYear()} ApoTech Indonesia</span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Siap Produksi
          </span>
        </div>
      </div>

      {/* Right form column */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-zinc-900">ApoTech</span>
              <span className="text-xs text-zinc-500 block">Sistem POS Apotek</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Masuk ke Akun</h2>
            <p className="text-sm text-zinc-500 mt-1.5">
              Masukkan email dan kata sandi Anda untuk mengakses sistem
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-xs uppercase tracking-wider text-red-700">Gagal Masuk</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Alamat Email
              </label>
              <Input
                type="email"
                placeholder="nama@apotek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Kata Sandi
                </label>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 font-medium"
              isLoading={isPending}
            >
              Masuk Sekarang
            </Button>
          </form>

          {/* Quick autofill for demo */}
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-xs font-medium text-zinc-500 text-center mb-3">
              Akun Demonstrasi / Pengujian Cepat:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoFill('pemilik@apotech.com')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-800 text-xs font-medium transition-colors text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="block font-bold">Role Pemilik</span>
                  <span className="text-[10px] text-teal-600">Akses Penuh</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('kasir@apotech.com')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-medium transition-colors text-left cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-zinc-600 shrink-0" />
                <div>
                  <span className="block font-bold">Role Kasir</span>
                  <span className="text-[10px] text-zinc-500">POS & Stok</span>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 text-center mt-2.5">
              Sandi default: <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-mono">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-sm">Memuat halaman login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
