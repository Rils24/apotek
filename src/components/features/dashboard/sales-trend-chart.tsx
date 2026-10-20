'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatRupiah } from '@/lib/format';

interface SalesTrendChartProps {
  data: {
    date: string;
    total: number;
    count: number;
  }[];
}

export function SalesTrendChart({ data }: SalesTrendChartProps) {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString('id-ID')}k`}
          />
          <Tooltip
            formatter={(value: any) => [formatRupiah(Number(value) || 0), 'Penjualan']}
            labelFormatter={(label) => `Tanggal: ${label}`}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e4e4e7',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#0d9488"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorTotal)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
