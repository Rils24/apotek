'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { getSettings, updateSettings } from '@/server/actions/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PharmacySettingsPage() {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('Apotek Sehat Farma');
  const [address, setAddress] = useState('Jl. Kesehatan No. 123, Jakarta Pusat');
  const [phone, setPhone] = useState('021-1234567');
  const [licenseNumber, setLicenseNumber] = useState('442/012/2024'); // SIA
  const [pharmacistName, setPharmacistName] = useState('apt. Siti Rahayu, S.Farm');
  const [pharmacistLicense, setPharmacistLicense] = useState('19850101/SIPA_31.71/2022/1001'); // SIPA

  useEffect(() => {
    getSettings('pharmacy').then((val: any) => {
      if (val) {
        setName(val.name || '');
        setAddress(val.address || '');
        setPhone(val.phone || '');
        setLicenseNumber(val.license_number || '');
        setPharmacistName(val.pharmacist_name || '');
        setPharmacistLicense(val.pharmacist_license || '');
      }
      setLoading(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSettings('pharmacy', {
        name,
        address,
        phone,
        license_number: licenseNumber,
        pharmacist_name: pharmacistName,
        pharmacist_license: pharmacistLicense,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Informasi apotek berhasil diperbarui!');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Pengaturan Profil Apotek
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Identitas resmi apotek, nomor Surat Izin Apotek (SIA), dan Surat Izin Praktik Apoteker (SIPA).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <CardTitle>Identitas Legalitas Sarana Kefarmasian</CardTitle>
            </div>
            <CardDescription>
              Informasi ini akan dicetak pada kepala struk kasir, resep salinan, dan laporan resmi SIPNAP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Apotek *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nomor Telepon Apotek *
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Alamat Lengkap Apotek *
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nomor Surat Izin Apotek (SIA) *
                </label>
                <Input
                  placeholder="Contoh: 442/012/2024"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Apoteker Pengelola Apotek (APA) *
                </label>
                <Input
                  placeholder="apt. Nama Apoteker, S.Farm"
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Nomor Surat Izin Praktik Apoteker (SIPA) *
              </label>
              <Input
                placeholder="19850101/SIPA_31.71/2022/1001"
                value={pharmacistLicense}
                onChange={(e) => setPharmacistLicense(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="justify-end border-t border-zinc-100 bg-zinc-50/50">
            <Button type="submit" isLoading={isPending} className="font-bold shadow-xs">
              <Save className="w-4 h-4 mr-2" /> Simpan Pengaturan
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
