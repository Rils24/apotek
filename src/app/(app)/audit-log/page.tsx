import * as React from 'react';
import { getAuditLogs } from '@/server/actions/settings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FileClock, User, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '@/lib/format';

export default async function AuditLogPage() {
  const logs = await getAuditLogs(150);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Log Aktivitas & Audit Sistem
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Rekaman jejak digital tidak dapat diubah (immutable log) untuk seluruh aksi sensitif pengguna.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileClock className="w-5 h-5 text-teal-600" />
            <CardTitle>Riwayat Jejak Audit Digital</CardTitle>
          </div>
          <CardDescription>
            Mencatat aktivitas login/logout, penyesuaian stok fisik, pembatalan void, dan manajemen akun kasir.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              <FileClock className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold">Belum ada catatan log aktivitas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu (WIB)</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Entitas</TableHead>
                  <TableHead>Detail Perubahan (JSON)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-zinc-600 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </TableCell>

                      <TableCell className="text-xs font-semibold text-zinc-800">
                        {log.user?.full_name || 'Sistem'}
                        <span className="block text-[10px] text-zinc-400 font-normal capitalize">
                          {log.user?.role || 'System'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                            log.action === 'void'
                              ? 'bg-red-100 text-red-800'
                              : log.action === 'stock_adjust' || log.action === 'stock_opname'
                              ? 'bg-amber-100 text-amber-800'
                              : log.action === 'create'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {log.action}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-zinc-600 capitalize">
                        {log.entity_type || '-'}
                      </TableCell>

                      <TableCell className="text-xs font-mono max-w-md truncate text-zinc-600">
                        {log.new_values
                          ? JSON.stringify(log.new_values)
                          : log.old_values
                          ? JSON.stringify(log.old_values)
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
