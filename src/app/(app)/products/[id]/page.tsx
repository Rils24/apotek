import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductById, getCategories } from '@/server/actions/products';
import { getCurrentUser } from '@/server/actions/auth';
import { ProductDetailClient } from './product-detail-client';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, currentUser] = await Promise.all([
    getProductById(id),
    getCategories(),
    getCurrentUser(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={product}
      categories={categories}
      isOwner={currentUser?.role === 'owner'}
    />
  );
}
