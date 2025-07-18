import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { IItemMovimiento } from "shared/interfaces";
import { useProductosStore } from "@/store/productos.store";

interface ItemMovimientoFormProps {
  item: IItemMovimiento;
  index: number;
  handleRemoveItem: (index: number) => void;
  handleUpdateItem: (
    index: number,
    field: keyof IItemMovimiento,
    value: unknown
  ) => void;
  origen: import("shared/interfaces").IAlmacen | null;
}

export function ItemMovimientoForm({
  item,
  index,
  handleRemoveItem,
  handleUpdateItem,
  origen,
}: ItemMovimientoFormProps) {
  const { getStock, stock } = useProductosStore();
  const [stockDisponible, setStockDisponible] = useState<number | null>(null);

  useEffect(() => {
    if (item.producto.id && origen?.id) {
      getStock(item.producto.id, origen.id);
    }
  }, [item.producto.id, origen?.id, getStock]);

  useEffect(() => {
    if (
      stock &&
      stock.producto.id === item.producto.id &&
      stock.almacen.id === origen?.id
    ) {
      setStockDisponible(stock.actual);
    }
  }, [stock, item.producto.id, origen?.id]);

  return (
    <div
      key={item.id}
      className="grid grid-cols-5 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors items-center min-h-[80px]"
    >
      {/* Info producto y notas */}
      <div className="col-span-3">
        <div className="text-sm font-medium flex items-center whitespace-nowrap">
          {item.producto.nombre}
          <span className="italic text-gray-400 text-xs ml-2">
            ({item.producto.sku})
          </span>
        </div>
        {origen && (
          <div className="mb-1 text-sm text-gray-500">
            <span className="font-semibold">Stock disponible en Origen: </span>
            <span className="font-normal">{stockDisponible ?? 0}</span>
          </div>
        )}
        <div className="mt-4 whitespace-nowrap">
          <Label className="mb-2">Notas</Label>
          <Textarea
            placeholder="Notas adicionales para este producto..."
            value={item.notas}
            onChange={(e) => handleUpdateItem(index, "notas", e.target.value)}
            className="resize-none h-10 min-h-0 max-w-[400px]"
            rows={1}
          />
        </div>
      </div>
      {/* Cantidad */}
      <div className="col-span-1 flex flex-col justify-end items-start h-full">
        <div className="ml-24 w-full whitespace-nowrap">
          <div className="flex items-center justify-between mb-2">
            <Label>Cantidad</Label>
            {/* Eliminado el label de máximo */}
          </div>
          {/* Input con tooltip del máximo */}
          <Input
            type="number"
            min="1"
            max={stockDisponible ?? 1}
            value={stockDisponible === 0 ? 0 : item.cantidad}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              const cantidad =
                stockDisponible !== null
                  ? Math.min(value, stockDisponible)
                  : value;
              handleUpdateItem(index, "cantidad", cantidad);
            }}
            className="w-full max-w-[120px] p-2 border border-gray-300 rounded-lg item-cantidad"
            title={
              stockDisponible !== null
                ? `Máximo: ${stockDisponible}`
                : undefined
            }
            disabled={stockDisponible === 0}
          />
        </div>
      </div>
      {/* Botón eliminar */}
      <div className="col-span-1 flex items-center justify-end h-full pr-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveItem(index)}
          className="text-red-500 hover:bg-red-100 hover:text-red-600"
          title="Eliminar producto"
        >
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
