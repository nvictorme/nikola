/* eslint-disable react-hooks/rules-of-hooks */
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ColumnDef } from "@tanstack/react-table";
import { IProducto, IStockProducto } from "shared/interfaces";
import {
  calcularStockDisponible,
  currencyFormat,
  isSuperAdmin,
} from "shared/helpers";
import { useAuthStore } from "@/store/auth.store";
import { Paises } from "shared/enums";
import { Button } from "@/components/ui/button";
import { FilePen, Package, Image, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routes } from "@/navigation/routes";
import { useProductosStore } from "@/store/productos.store";
import { useCallback, useEffect, useState } from "react";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { AlmacenWithStock } from "@/pages/ordenes/ItemOrdenForm";
import { Skeleton } from "@/components/ui/skeleton";

export type Producto = Pick<
  IProducto,
  "sku" | "nombre" | "modelo" | "portada" | "costo" | "precios"
>;

export const columnasProductos: ColumnDef<Producto>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">{row.original.sku}</span>
      </div>
    ),
  },
  {
    accessorKey: "portada",
    header: "",
    cell: ({ row }) => (
      <Avatar>
        <AvatarImage src={row.original.portada?.url || ""} />
      </Avatar>
    ),
  },
  {
    id: "nombre",
    header: "Producto",
    cell: ({ row }) => (
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium">{row.original.nombre}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.modelo}
        </span>
      </div>
    ),
  },
  {
    id: "stock",
    header: "Stock",
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
    id: "precio",
    header: "Precio",
    cell: ({ row }) => {
      const producto = row.original as IProducto;
      const { user } = useAuthStore();
      const isAdmin = isSuperAdmin(user);

      if (isAdmin) {
        return (
          <div className="flex flex-col items-end">
            {currencyFormat({
              value: producto.costo,
              fractionDigits: 2,
              currency: user?.pais.nombre === Paises.españa ? "EUR" : "USD",
              locale: user?.pais.nombre === Paises.españa ? "es-ES" : "en-US",
            })}
          </div>
        );
      }

      const isAvailableInCountry = producto.paises.some(
        (p) => p.id === user?.pais?.id
      );

      const precios = isAvailableInCountry
        ? producto.precios.find((p) => p.pais.id === user?.pais?.id)
        : null;

      if (!precios) {
        return (
          <span className="text-muted-foreground italic">No disponible</span>
        );
      }

      const { precioLista, precioExw, precioOferta, enOferta } = precios;

      const formatPrice = (value: number) =>
        currencyFormat({
          value,
          fractionDigits: 2,
          currency: user?.pais.nombre === Paises.españa ? "EUR" : "USD",
          locale: user?.pais.nombre === Paises.españa ? "es-ES" : "en-US",
        });

      if (user?.exw && precioExw > 0) {
        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-medium text-primary w-fit rounded-full bg-primary/10 px-2 py-0.5">
              {formatPrice(precioExw)}
            </span>
            <span className="text-xs text-muted-foreground">EXW</span>
          </div>
        );
      }

      if (enOferta && precioOferta > 0) {
        return (
          <div className="flex flex-col items-end gap-1">
            <span className="font-medium text-primary w-fit rounded-full bg-primary/10 px-3 py-1">
              {formatPrice(precioOferta)}
            </span>
            <span className="text-sm text-muted-foreground line-through opacity-75">
              {formatPrice(precioLista || 0)}
            </span>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-end font-medium">
          {formatPrice(precioLista || 0)}
        </div>
      );
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const producto = row.original as IProducto;
      const { user } = useAuthStore();
      const isAdmin = isSuperAdmin(user);
      const navigate = useNavigate();
      const { setShowDetails, setShowGallery, setShowStockModal, setProducto } =
        useProductosStore();

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
          </div>
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
