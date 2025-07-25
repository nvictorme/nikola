/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef, CellContext } from "@tanstack/react-table";
import { IProducto, IStockProducto } from "shared/interfaces";
import {
  calcularStockDisponible,
  currencyFormat,
  isSuperAdmin,
} from "shared/helpers";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { FilePen, Package, Image, Eye, ChartLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routes } from "@/navigation/routes";
import { useProductosStore } from "@/store/productos.store";
import { useCallback, useEffect, useState } from "react";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { AlmacenWithStock } from "@/pages/ordenes/ItemOrdenForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductoHistorialPrecioDialog } from "./ProductoHistorialPrecioDialog";

export type Producto = Pick<
  IProducto,
  | "sku"
  | "nombre"
  | "modelo"
  | "portada"
  | "costo"
  | "precioGeneral"
  | "precioInstalador"
  | "precioMayorista"
  | "precioOferta"
  | "enOferta"
  | "inicioOferta"
  | "finOferta"
>;

export const columnasProductos: ColumnDef<Producto>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium">{row.original.sku}</span>
      </div>
    ),
  },
  {
    id: "nombre",
    header: "Producto",
    cell: ({ row }) => (
      <div className="flex flex-col items-start min-w-[300px]">
        <span className="text-sm font-medium">{row.original.nombre}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.modelo}
        </span>
      </div>
    ),
  },
  {
    id: "stock",
    // El título 'Stock' se alinea a la derecha para mejor visualización
    header: () => <div className="text-right pr-20">Stock</div>,
    cell: ({ row }) => {
      const producto = row.original as IProducto;
      const { listarAlmacenesPorProducto } = useAlmacenesStore();
      const [almacenes, setAlmacenes] = useState<AlmacenWithStock[]>([]);
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        const fetchAlmacenes = async () => {
          setIsLoading(true);
          try {
            const almacenesData = await listarAlmacenesPorProducto(producto.id);
            setAlmacenes(almacenesData as AlmacenWithStock[]);
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Error fetching almacenes"
            );
          } finally {
            setIsLoading(false);
          }
        };

        fetchAlmacenes();
      }, [listarAlmacenesPorProducto, producto.id]);

      if (isLoading) {
        return <Skeleton className="h-8 w-20" />;
      }

      if (error) {
        return <span className="text-destructive text-sm">{error}</span>;
      }

      return (
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          {almacenes.map((almacen) => (
            <div
              key={almacen.id}
              className="flex items-center justify-between text-sm group hover:bg-secondary/40 rounded-md px-2 py-0.5 transition-colors"
            >
              <span className="text-muted-foreground font-medium text-left">
                {almacen.nombre}
              </span>
              <span className="font-semibold ml-2 px-2 py-0.5 bg-secondary rounded-full text-right">
                {calcularStockDisponible(almacen.stock as IStockProducto)}
              </span>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    id: "costo",
    // El título 'Costo' se alinea a la derecha para mejor visualización
    header: () => <div className="text-right pr-1">Costo</div>,
    accessorFn: (row) => currencyFormat({ value: row.costo }),
    cell: ({ getValue }: CellContext<Producto, unknown>) => (
      <div className="text-right">
        <span className="text-sm">{getValue() as string}</span>
      </div>
    ),
  },
  {
    id: "precio",
    // El título 'Precio' se alinea a la derecha para mejor visualización
    header: () => <div className="text-right pr-2">Precio</div>,
    cell: ({ row }) => {
      // Se muestra el precioInstalador como precio principal
      // El precio tachado en caso de oferta es precioGeneral
      const {
        precioGeneral,
        precioInstalador,
        precioOferta,
        enOferta,
        inicioOferta,
        finOferta,
      } = row.original;
      const now = new Date();
      const isOfferActive =
        enOferta &&
        precioOferta &&
        inicioOferta &&
        (!finOferta ||
          (now >= new Date(inicioOferta) && now <= new Date(finOferta)));

      if (isOfferActive) {
        return (
          <div className="flex flex-col items-end">
            {/* Precio general tachado cuando hay oferta */}
            <span className="text-sm line-through text-muted-foreground">
              {currencyFormat({ value: precioGeneral })}
            </span>
            {/* Precio de oferta */}
            <span className="text-sm font-semibold text-primary">
              {currencyFormat({ value: precioOferta })}
            </span>
          </div>
        );
      }

      // Precio de instalador cuando no hay oferta
      return (
        <div className="text-right">
          <span className="text-sm">
            {currencyFormat({ value: precioInstalador })}
          </span>
        </div>
      );
    },
  },
  {
    id: "acciones",
    // El título 'Acciones' se alinea a la derecha para mejor visualización
    header: () => <div className="text-right pr-24">Acciones</div>,
    cell: ({ row }) => {
      const producto = row.original as IProducto;
      const { user } = useAuthStore();
      const isAdmin = isSuperAdmin(user);
      const navigate = useNavigate();
      const { setShowDetails, setShowGallery, setShowStockModal, setProducto } =
        useProductosStore();
      const [showHistorialPrecio, setShowHistorialPrecio] = useState(false);

      const onDetallesCallback = useCallback(() => {
        setProducto(producto);
        setShowDetails(true);
      }, [setShowDetails, setProducto, producto]);

      const onGaleriaCallback = useCallback(() => {
        setProducto(producto);
        setShowGallery(true);
      }, [setShowGallery, setProducto, producto]);

      const onStockCallback = useCallback(() => {
        setProducto(producto);
        setShowStockModal(true);
      }, [setShowStockModal, setProducto, producto]);

      if (isAdmin) {
        return (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onDetallesCallback}
                className="hover:bg-secondary"
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Detalles</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(
                    routes.producto.path.replace(":productoId", producto.id)
                  );
                }}
                className="hover:bg-secondary"
              >
                <FilePen className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onStockCallback}
                className="hover:bg-secondary"
              >
                <Package className="h-4 w-4" />
                <span className="sr-only">Stock</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onGaleriaCallback}
                className="hover:bg-secondary"
              >
                <Image className="h-4 w-4" />
                <span className="sr-only">Galeria</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistorialPrecio(true)}
                className="hover:bg-secondary"
              >
                <ChartLine className="h-4 w-4" />
                <span className="sr-only">Historial de Precios</span>
              </Button>
            </div>
            <ProductoHistorialPrecioDialog
              open={showHistorialPrecio}
              onClose={() => setShowHistorialPrecio(false)}
              productoId={producto.id}
            />
          </>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDetallesCallback}
            className="hover:bg-secondary"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Detalles</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onGaleriaCallback}
            className="hover:bg-secondary"
          >
            <Image className="h-4 w-4" />
            <span className="sr-only">Galeria</span>
          </Button>
        </div>
      );
    },
  },
];
