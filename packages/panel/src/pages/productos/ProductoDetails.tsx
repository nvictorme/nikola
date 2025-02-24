import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currencyFormat } from "shared/helpers";
import { useProductosStore } from "@/store/productos.store";
import { useEffect, useState } from "react";
import { IProducto } from "shared/interfaces";
import { ApiClient } from "@/api/api.client";
import { Spinner } from "@/components/Spinner";

interface ProductoDetailsProps {
  open: boolean;
  onClose: () => void;
}

export default function ProductoDetails({
  open,
  onClose,
}: ProductoDetailsProps) {
  const { producto: target } = useProductosStore();
  const [producto, setProducto] = useState<IProducto | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (target?.id) {
      setLoading(true);
      new ApiClient()
        .get(`/productos/${target.id}`, {})
        .then(({ data }) => {
          setProducto(data.producto);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [target?.id]);

  if (!producto || !producto.dimensiones) {
    return null;
  }

  const { precio, enOferta, precioOferta } = producto;

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {producto.nombre} - {producto.modelo}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <img
              src={producto.portada?.url || ""}
              alt={producto.nombre}
              className="w-full rounded-lg object-cover"
            />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Detalles del Producto</h3>
              <p className="text-sm text-muted-foreground">
                SKU: {producto.sku}
              </p>
              <p className="text-sm text-muted-foreground">
                Categoría: {producto.categoria.nombre}
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Dimensiones</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <p>
                  Largo: {producto.dimensiones.largo}{" "}
                  {producto.dimensiones.unidadLongitud}
                </p>
                <p>
                  Ancho: {producto.dimensiones.ancho}{" "}
                  {producto.dimensiones.unidadLongitud}
                </p>
                <p>
                  Alto: {producto.dimensiones.alto}{" "}
                  {producto.dimensiones.unidadLongitud}
                </p>
                <p>
                  Peso: {producto.dimensiones.peso}{" "}
                  {producto.dimensiones.unidadPeso}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Embalaje</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <p>
                  Largo: {producto.embalaje.largo}{" "}
                  {producto.embalaje.unidadLongitud}
                </p>
                <p>
                  Ancho: {producto.embalaje.ancho}{" "}
                  {producto.embalaje.unidadLongitud}
                </p>
                <p>
                  Alto: {producto.embalaje.alto}{" "}
                  {producto.embalaje.unidadLongitud}
                </p>
                <p>
                  Peso: {producto.embalaje.peso} {producto.embalaje.unidadPeso}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Precios</h3>
              <div className="space-y-1">
                {precio ? (
                  <p className="text-sm">
                    Precio:{" "}
                    {currencyFormat({
                      value: precio,
                      fractionDigits: 2,
                    })}
                  </p>
                ) : null}

                {enOferta && precioOferta ? (
                  <p className="text-sm text-green-600">
                    Precio Oferta:{" "}
                    {currencyFormat({
                      value: precioOferta,
                      fractionDigits: 2,
                    })}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Garantía</h3>
              <p className="text-sm text-muted-foreground">
                {producto.garantia || "Sin garantía"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Descripción</h3>
              <p className="text-sm text-muted-foreground">
                {producto.descripcion || "Sin descripción"}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
