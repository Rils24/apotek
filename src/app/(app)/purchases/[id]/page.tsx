import * as React from 'react';
import { notFound } from 'next/navigation';
import { getPurchaseById } from '@/server/actions/purchases';
import { getCurrentUser } from '@/server/actions/auth';
import { PurchaseDetailClient } from './purchase-detail-client';

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [purchase, currentUser] = await Promise.all([
    getPurchaseById(id),
    getCurrentUser(),
  ]);

  if (!purchase) {
    notFound();
  }

  return (
    <PurchaseDetailClient
      purchase={purchase}
      isOwner={currentUser?.role === 'owner'}
    />
  );
}
