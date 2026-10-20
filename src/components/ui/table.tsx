import * as React from 'react';

export function Table({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm text-left ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`border-b border-zinc-200 bg-zinc-50/75 text-xs uppercase font-medium text-zinc-500 tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={`divide-y divide-zinc-200/80 bg-white ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`transition-colors hover:bg-zinc-50/80 data-[state=selected]:bg-zinc-100 ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className = '',
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle font-semibold text-zinc-600 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = '',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`p-4 align-middle text-zinc-800 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}
