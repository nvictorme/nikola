import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { currencyFormat } from "shared/helpers";
import { useAuthStore } from "@/store/auth.store";
import { Paises } from "shared/enums";
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
  const { user } = useAuthStore();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  const precios = producto?.precios?.[0];
  const { precioLista, precioExw, precioOferta, enOferta } = precios || {};

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

            {precios ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Precios</h3>
                <div className="space-y-1">
                  {precioLista ? (
                    <p className="text-sm">
                      Precio Lista:{" "}
                      {currencyFormat({
                        value: precioLista,
                        fractionDigits: 2,
                        currency:
                          user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                        locale:
                          user?.pais.nombre === Paises.españa
                            ? "es-ES"
                            : "en-US",
                      })}
                    </p>
                  ) : null}

                  {user?.exw && precioExw ? (
                    <p className="text-sm">
                      Precio EXW:{" "}
                      {currencyFormat({
                        value: precioExw,
                        fractionDigits: 2,
                        currency:
                          user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                        locale:
                          user?.pais.nombre === Paises.españa
                            ? "es-ES"
                            : "en-US",
                      })}
                    </p>
                  ) : null}

                  {enOferta && precioOferta ? (
                    <p className="text-sm text-green-600">
                      Precio Oferta:{" "}
                      {currencyFormat({
                        value: precioOferta,
                        fractionDigits: 2,
                        currency:
                          user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                        locale:
                          user?.pais.nombre === Paises.españa
                            ? "es-ES"
                            : "en-US",
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold">Precios</h3>
                <p className="text-sm text-muted-foreground">
                  No hay precios disponibles para tu región
                </p>
              </div>
            )}
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

            {producto.requiereMotor && producto.motores?.length > 0 && (
              <div>
                <h3 className="font-semibold">Requiere Motor</h3>
                <div className="space-y-1">
                  {producto.motores.map((motor) => (
                    <p key={motor.id} className="text-sm text-muted-foreground">
                      {motor.motor.nombre?.trim()} - Cantidad: {motor.cantidad}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
