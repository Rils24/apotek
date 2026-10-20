'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { getSettings, updateSettings } from '@/server/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Printer, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ReceiptSettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [header, setHeader] = useState('Apotek Sehat Farma');
  const [footer, setFooter] = useState('Semoga Lekas Sembuh & Sehat Selalu. Terima kasih atas kunjungan Anda.');
  const [width, setWidth] = useState<'58mm' | '80mm'>('80mm');

  useEffect(() => {
    getSettings('receipt').then((val: any) => {
      if (val) {
        setHeader(val.header || 'Apotek Sehat Farma');
        setFooter(val.footer || 'Terima kasih atas kunjungan Anda');
        setWidth(val.width || '80mm');
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSettings('receipt', {
        header,
        footer,
        width,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Pengaturan format struk berhasil disimpan');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Format Struk Thermal Kasir
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Sesuaikan teks header, footer, dan ukuran kertas printer thermal apotek (58mm / 80mm).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Settings form (7 cols) */}
        <div className="md:col-span-7">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-teal-600" />
                  <CardTitle>Tata Letak & Ukuran Printer</CardTitle>
                </div>
                <CardDescription>
                  Printer thermal POS mendukung format standar mini-pos 58mm dan desktop pos 80mm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Lebar Default Kertas Thermal
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWidth('58mm')}
                      className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                        width === '58mm'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      58 mm (Printer Bluetooth / Mobile)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWidth('80mm')}
                      className={`p-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                        width === '80mm'
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                      }`}
                    >
                      80 mm (Printer Desktop Kasir)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Judul Header Struk
                  </label>
                  <Input value={header} onChange={(e) => setHeader(e.target.value)} required />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Pesan Footer Bawah Struk
                  </label>
                  <textarea
                    rows={3}
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    className="w-full rounded-md border border-zinc-300 p-2 text-xs focus-visible:outline-teal-500 shadow-xs"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-zinc-100 bg-zinc-50/50">
                <Button type="submit" isLoading={isPending} className="font-bold shadow-xs">
                  <Save className="w-4 h-4 mr-2" /> Simpan Pengaturan Struk
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>

        {/* Live Preview (5 cols) */}
        <div className="md:col-span-5">
          <Card className="p-4 bg-zinc-100 border-zinc-200">
            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider block mb-3 text-center">
              Pratinjau Struk Cetak ({width})
            </span>
            <div
              className={`bg-white p-4 shadow-sm border border-zinc-200 mx-auto font-mono text-[10px] text-zinc-800 leading-tight ${
                width === '58mm' ? 'w-[58mm]' : 'w-[80mm]'
              }`}
            >
              <div className="text-center pb-2 border-b border-dashed border-zinc-400">
                <h4 className="font-bold text-xs uppercase">{header}</h4>
                <p className="text-[9px] text-zinc-500">Jl. Kesehatan No. 123, Jakarta</p>
                <p className="text-[9px] text-zinc-500">Telp: 021-1234567</p>
              </div>

              <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5 text-[9px]">
                <div className="flex justify-between">
                  <span>No: INV-20261020-0012</span>
                  <span>14:30 WIB</span>
                </div>
                <div>Kasir: Siti Rahayu</div>
              </div>

              <div className="py-2 border-b border-dashed border-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Paracetamol 500mg</span>
                  <span className="font-bold">15.000</span>
                </div>
                <div className="flex justify-between text-zinc-500 text-[8px]">
                  <span>10 Tablet x 1.500</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL:</span>
                  <span>Rp 15.000</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span>TUNAI:</span>
                  <span>Rp 20.000</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold">
                  <span>KEMBALIAN:</span>
                  <span>Rp 5.000</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[8px] text-zinc-500">
                <p>{footer}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
