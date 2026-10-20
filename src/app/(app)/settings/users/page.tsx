'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import {
  getUsers,
  createCashierAccount,
  toggleUserStatus,
  resetUserPassword,
} from '@/server/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  UserPlus,
  KeyRound,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDateShort } from '@/lib/format';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  role: 'owner' | 'cashier';
  isActive: boolean;
  createdAt: string;
}

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  // Password Reset Modal state
  const [resetUser, setResetUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateCashier = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('full_name', createName);
    formData.append('email', createEmail);
    formData.append('password', createPassword);

    startTransition(async () => {
      const res = await createCashierAccount(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Akun kasir berhasil didaftarkan');
        setIsCreateOpen(false);
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        fetchUsers();
      }
    });
  };

  const handleToggleStatus = (user: UserData) => {
    const nextStatus = !user.isActive;
    startTransition(async () => {
      const res = await toggleUserStatus(user.id, nextStatus);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Akun ${user.fullName} telah ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}`
        );
        fetchUsers();
      }
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;

    startTransition(async () => {
      const res = await resetUserPassword(resetUser.id, newPassword);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Kata sandi untuk ${resetUser.fullName} berhasil diperbarui`);
        setResetUser(null);
        setNewPassword('');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Kelola Akun & Kasir
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Tambah staf kasir apotek, atur status akses, atau perbarui kata sandi.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="shadow-xs shrink-0">
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Kasir Baru
        </Button>
      </div>

      {/* Users Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna Sistem</CardTitle>
          <CardDescription>
            Kasir hanya memiliki akses ke modul kasir POS dan katalog stok obat tanpa bisa melihat modal/HPP.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Memuat daftar pengguna...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <p className="text-sm">Belum ada staf kasir yang terdaftar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Email Login</TableHead>
                  <TableHead>Hak Akses (Role)</TableHead>
                  <TableHead>Status Akun</TableHead>
                  <TableHead>Terdaftar Sejak</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-zinc-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 text-xs font-bold">
                          {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span>{u.fullName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-600 font-mono text-xs">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {u.role === 'owner' ? (
                        <Badge variant="primary" className="font-semibold">
                          <Shield className="w-3 h-3 mr-1" /> Pemilik Apotek
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          <User className="w-3 h-3 mr-1" /> Kasir Farmasi
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                          <XCircle className="w-3.5 h-3.5 text-zinc-400" /> Nonaktif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 text-xs">
                      {formatDateShort(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role === 'cashier' ? (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetUser(u);
                              setNewPassword('');
                            }}
                            className="text-xs h-8"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset Sandi
                          </Button>
                          <Button
                            variant={u.isActive ? 'outline' : 'primary'}
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleToggleStatus(u)}
                            className="text-xs h-8"
                          >
                            {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Akun Utama</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal: Tambah Kasir Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent onClose={() => setIsCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Tambah Akun Kasir Baru</DialogTitle>
            <DialogDescription>
              Kasir akan mendapatkan akses ke aplikasi untuk melayani transaksi kasir POS dan cek stok obat.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCashier}>
            <DialogBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Nama Lengkap Kasir
                </label>
                <Input
                  placeholder="Contoh: Rina Anggraini, S.Farm"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Email Login
                </label>
                <Input
                  type="email"
                  placeholder="kasir.rina@apotech.com"
                  icon={<Mail className="w-4 h-4" />}
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Kata Sandi Awal
                </label>
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  icon={<Lock className="w-4 h-4" />}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  minLength={6}
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Berikan kata sandi ini kepada kasir untuk login pertama kali.
                </p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={isPending}>
                Simpan & Daftarkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Reset Password */}
      <Dialog open={!!resetUser} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent onClose={() => setResetUser(null)}>
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi</DialogTitle>
            <DialogDescription>
              Atur ulang kata sandi login untuk pengguna <strong>{resetUser?.fullName}</strong> ({resetUser?.email}).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            <DialogBody className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  icon={<Lock className="w-4 h-4" />}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetUser(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" isLoading={isPending}>
                Simpan Sandi Baru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
