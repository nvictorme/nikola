import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Label } from "@radix-ui/react-dropdown-menu";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Loader2 } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  hideFilter?: boolean;
  loading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  page,
  setPage,
  setLimit,
  hideFilter = false,
  limit = 10,
  loading = false,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    pageCount,
    rowCount: data.length,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      globalFilter,
    },
  });

  // Set page size on limit change
  useEffect(() => {
    table.setPageSize(limit);
  }, [limit, table]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <div className="flex py-4 justify-between align-baseline">
        {!hideFilter ? (
          <Input
            value={globalFilter ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setGlobalFilter(String(value));
            }}
            placeholder="Filtrar..."
            className="w-[200px]"
          />
        ) : null}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex py-4 justify-between align-baseline">
        {/*
          Se agregó un input numérico para permitir la navegación directa a una página específica.
          El usuario puede escribir el número de página y navegar directamente.
        */}
        <div className="flex items-center space-x-2">
          <Label className="text-sm">Página:</Label>
          <Input
            type="number"
            min={1}
            max={pageCount}
            value={page}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val > pageCount) val = pageCount;
              if (val < 1) val = 1;
              setPage(val);
            }}
            onBlur={(e) => {
              let val = Number(e.target.value);
              if (!val || val < 1) val = 1;
              if (val > pageCount) val = pageCount;
              setPage(val);
            }}
            className="w-16 mx-2"
          />
          <span className="text-sm">/ {Number(pageCount)}</span>
        </div>
        {/*
          Select para cambiar el límite de elementos por página.
        */}
        <Select
          value={String(limit)}
          onValueChange={(value) => {
            setLimit(Number(value));
          }}
        >
          <SelectTrigger className="w-[70px]">
            <SelectValue placeholder="Limite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPage(Math.max(1, page - 1));
          }}
          disabled={page === 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPage(Math.min(pageCount, page + 1));
          }}
          disabled={page === pageCount || table.getRowModel().rows.length === 0}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
