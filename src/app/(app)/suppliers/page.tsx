'use client';

import * as React from 'react';
import { useState, useEffect, useTransition } from 'react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/server/actions/purchases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Truck, Plus, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [termsDays, setTermsDays] = useState(30);

  const fetchSuppliers = async () => {
    setLoading(true);
    const data = await getSuppliers();
    setSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setTermsDays(30);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingId(s.id);
    setName(s.name);
    setContactPerson(s.contact_person || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setTermsDays(s.payment_terms_days || 30);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama supplier wajib diisi');
      return;
    }

    startTransition(async () => {
      const payload = {
        name,
        contact_person: contactPerson,
        phone,
        email,
        address,
        payment_terms_days: termsDays,
      };

      const res = editingId
        ? await updateSupplier(editingId, payload)
        : await createSupplier(payload);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(editingId ? 'Data supplier diperbarui' : 'Supplier baru ditambahkan');
        setIsModalOpen(false);
        fetchSuppliers();
      }
    });
  };

  const handleDelete = (id: string, sName: string) => {
    if (!confirm(`Hapus supplier ${sName}?`)) return;
    startTransition(async () => {
      const res = await deleteSupplier(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Supplier dihapus');
        fetchSuppliers();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Daftar Supplier / PBF
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Data Pedagang Besar Farmasi rekanan resmi apotek beserta tempo pembayaran hutang.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="shadow-xs font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Supplier
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400">Memuat data supplier...</div>
          ) : suppliers.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <Truck className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada supplier yang terdaftar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Supplier / PBF</TableHead>
                  <TableHead>Kontak Person</TableHead>
                  <TableHead>Telepon & Email</TableHead>
                  <TableHead>Alamat Gudang / Kantor</TableHead>
                  <TableHead className="text-right">Tempo Bayar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-semibold text-zinc-900 text-sm">
                      {s.name}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-700">
                      {s.contact_person || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      <div>{s.phone || '-'}</div>
                      {s.email && <div className="text-zinc-400">{s.email}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500 max-w-xs truncate">
                      {s.address || '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-xs tabular-nums text-zinc-800">
                      {s.payment_terms_days} hari
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(s)}
                          className="h-8 w-8 p-0"
                          title="Edit supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s.id, s.name)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Hapus supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal: Tambah/Edit Supplier */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent onClose={() => setIsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Supplier' : 'Tambah Supplier / PBF Baru'}
            </DialogTitle>
            <DialogDescription>
              Isi data kontak dan syarat tempo pembayaran faktur supplier.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Supplier / PBF *
                </label>
                <Input
                  placeholder="Contoh: PT Kimia Farma Trading & Distribution"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Nama Kontak Person
                  </label>
                  <Input
                    placeholder="Budi Santoso"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Tempo Bayar (Hari)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={termsDays}
                    onChange={(e) => setTermsDays(Number(e.target.value) || 30)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Nomor Telepon
                  </label>
                  <Input
                    placeholder="021-4287-3800"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                    Email Kontak
                  </label>
                  <Input
                    type="email"
                    placeholder="order@pbf.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Alamat Kantor / Gudang PBF
                </label>
                <Input
                  placeholder="Jl. Veteran No. 9, Jakarta Pusat"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isPending} className="font-bold">
                Simpan Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
