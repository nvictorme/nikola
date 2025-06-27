import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { IProducto } from "shared/interfaces";
import { useProductosStore } from "@/store/productos.store";

interface ProductSelectorProps {
  onSelected: (selected: IProducto[]) => void;
  soloMotores?: boolean;
  initialSelected?: IProducto[];
}

export default function ProductSelector({
  onSelected,
  soloMotores = false,
  initialSelected = [],
}: ProductSelectorProps) {
  const {
    productos: products,
    term,
    setTerm,
    resetFilters,
  } = useProductosStore();
  const [checkedProducts, setCheckedProducts] = useState<
    Map<string, IProducto>
  >(new Map(initialSelected.map((p) => [p.id, p])));

  useEffect(() => {
    resetFilters();
  }, [resetFilters]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        product.nombre.toLowerCase().includes(term?.toLowerCase() || "") ||
        product.sku.toLowerCase().includes(term?.toLowerCase() || "")
    );
    return filtered;
  }, [products, term]);

  const handleCheck = (product: IProducto) => {
    setCheckedProducts((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(product.id)) {
        newMap.delete(product.id);
      } else {
        newMap.set(product.id, product);
      }
      return newMap;
    });
  };

  const handleAddSelected = useCallback(() => {
    onSelected(Array.from(checkedProducts.values()));
    setCheckedProducts(new Map());
    setTerm("");
  }, [checkedProducts, onSelected, setTerm]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Filtrar ${soloMotores ? "motores" : "productos"}...`}
          value={term || ""}
          onChange={(e) => setTerm(e.target.value)}
          className="pl-8 min-w-[600px]"
        />
      </div>

      {!products.length ? (
        <div className="text-center p-4">No hay productos disponibles.</div>
      ) : (
        <ScrollArea className="h-[200px] border rounded-md p-4 min-w-[600px]">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex items-center space-x-2 py-2">
              <Checkbox
                id={product.id}
                checked={checkedProducts.has(product.id)}
                onCheckedChange={() => handleCheck(product)}
                className="ml-1"
              />
              <label
                htmlFor={product.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {product.nombre}
                <span className="italic text-gray-400 text-xs ml-2">
                  ({product.sku})
                </span>
              </label>
            </div>
          ))}
        </ScrollArea>
      )}

      <Button onClick={handleAddSelected} disabled={checkedProducts.size === 0}>
        Confirmar seleccionados
      </Button>

      <div className="space-y-2">
        {/*
          Corrección: Se agregó espacio entre el número y 'seleccionados' para evitar el error de texto pegado.
        */}
        <h3 className="text-lg font-semibold">
          {checkedProducts.size} {soloMotores ? "Motores" : "Productos"}{" "}
          seleccionados:
        </h3>
        <ScrollArea className="h-[200px] border rounded-md p-4 min-w-[600px]">
          {Array.from(checkedProducts.values()).map((product) => (
            <div
              key={product.id}
              className="flex justify-between items-center py-2"
            >
              <span>
                {product.nombre}
                <span className="italic text-gray-400 text-xs ml-2">
                  ({product.sku})
                </span>
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleCheck(product)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
