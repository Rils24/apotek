import * as React from 'react';
import { getSales, getSaleById } from '@/server/actions/sales';
import { getCurrentUser } from '@/server/actions/auth';
import { TransactionsClient } from './transactions-client';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const [sales, currentUser] = await Promise.all([
    getSales({
      search: params.q,
      status: params.status,
      startDate: params.start,
      endDate: params.end,
    }),
    getCurrentUser(),
  ]);

  return (
    <TransactionsClient
      sales={sales}
      isOwner={currentUser?.role === 'owner'}
    />
  );
}
