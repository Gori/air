"use client"

import * as React from 'react'
import Link from 'next/link'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedCount: number
  totalCount: number
  hasInsights: boolean
  joinedAt: string | null
}

function getRoleClasses(role: string) {
  const r = role?.toLowerCase()
  if (r === 'manager') return 'font-sans tracking-normal bg-blue-100 text-blue-700 border-blue-200'
  if (r === 'admin') return 'font-sans tracking-normal bg-violet-100 text-violet-700 border-violet-200'
  return 'font-sans tracking-normal bg-neutral-100 text-neutral-700 border-neutral-200'
}

function getStatusClasses(status: AdminUserRow['status']) {
  if (status === 'completed') return 'font-sans tracking-normal bg-emerald-100 text-emerald-700 border-emerald-200'
  if (status === 'in_progress') return 'font-sans tracking-normal bg-amber-100 text-amber-700 border-amber-200'
  return 'font-sans tracking-normal bg-neutral-100 text-neutral-700 border-neutral-200'
}

const columns: ColumnDef<AdminUserRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <Link href={`/admin/users/${row.original.id}`} className="underline-offset-4 hover:underline">
        {row.original.name || '—'}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => (
      <Badge variant="outline" className={"capitalize " + getRoleClasses(row.original.role)}>
        {row.original.role}
      </Badge>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const r = row.original
      if (r.status === 'completed') {
        return <Badge variant="outline" className={getStatusClasses(r.status)}>Completed</Badge>
      }
      if (r.status === 'not_started') {
        return <Badge variant="outline" className={getStatusClasses(r.status)}>Not started</Badge>
      }
      const label = `${r.completedCount}/${r.totalCount}`
      return <Badge variant="outline" className={getStatusClasses(r.status)}>{label}</Badge>
    },
  },
  {
    id: 'assessment',
    header: 'Personal Assessment',
    cell: ({ row }) =>
      row.original.hasInsights ? (
        <Link href={`/admin/users/${row.original.id}`} className="text-primary underline-offset-4 hover:underline">
          Read
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: 'joinedAt',
    header: 'Date joined',
    cell: ({ row }) => {
      const value = row.original.joinedAt
      return value ? new Date(value).toLocaleDateString() : '—'
    },
  },
]

export function UsersTable({ data }: { data: AdminUserRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-neutral-100 [&_tr]:border-neutral-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-sans text-base px-4 py-1">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="[&_tr]:border-neutral-200">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center px-4">
                No users.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}


