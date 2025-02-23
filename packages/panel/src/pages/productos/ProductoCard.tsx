import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePen, Image, Package } from "lucide-react";
import { IProducto } from "shared/interfaces";
import { currencyFormat, isSuperAdmin } from "shared/helpers";
import { useAuthStore } from "@/store/auth.store";
import { Paises } from "shared/enums";
import { routes } from "@/navigation/routes";
import { useNavigate } from "react-router-dom";

export default function ProductoCard({
  producto,
  onGaleria,
  onDetalles,
  onStock,
}: {
  producto: IProducto;
  onGaleria: () => void;
  onDetalles: () => void;
  onStock: () => void;
}) {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);
  const navigate = useNavigate();

  // Check if the product is available in user's country
  const isAvailableInCountry = producto.paises.some(
    (p) => p.id === user?.pais?.id
  );

  // Get the first price if available in country, otherwise null
  const precios = isAvailableInCountry ? producto.precios[0] : null;
  const { precioLista, precioExw, precioOferta, enOferta } = precios || {};

  return (
    <>
      <Card
        className={`w-full max-w-sm relative ${
          precios?.enOferta ? "ring-2 ring-primary ring-offset-2" : ""
        }`}
      >
        {precios?.enOferta && (
          <div className="absolute -top-3 -right-3 z-10">
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-white bg-primary rounded-full">
              Oferta
            </span>
          </div>
        )}
        <div className="relative group">
          <img
            src={producto.portada?.url || ""}
            alt={producto.nombre}
            width={600}
            height={450}
            className="aspect-[4/3] w-full rounded-t-lg object-contain transition-opacity group-hover:opacity-80"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-md bg-background/70 px-3 py-1 backdrop-blur-sm">
            <span className="text-sm font-medium text-muted-foreground">
              SKU:
            </span>
            <span className="text-sm font-medium">{producto.sku}</span>
          </div>
          {isAdmin ? (
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 rounded-md bg-background/70 px-3 py-1 backdrop-blur-sm">
              <span className="text-2xl font-bold">
                {currencyFormat({
                  value: producto.costo,
                  fractionDigits: 2,
                  currency: user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                  locale:
                    user?.pais.nombre === Paises.españa ? "es-ES" : "en-US",
                })}
              </span>
            </div>
          ) : (
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 rounded-md bg-background/70 px-3 py-1 backdrop-blur-sm">
              {precios && (
                <>
                  {user?.exw && precioExw! > 0 ? (
                    <span className="text-xl font-semibold">
                      EXW{" "}
                      {currencyFormat({
                        value: precioExw!,
                        fractionDigits: 2,
                        currency:
                          user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                        locale:
                          user?.pais.nombre === Paises.españa
                            ? "es-ES"
                            : "en-US",
                      })}
                    </span>
                  ) : null}
                  {enOferta && precioOferta! > 0 ? (
                    <>
                      <span className="text-l font-bold">
                        {currencyFormat({
                          value: precioOferta!,
                          fractionDigits: 2,
                          currency:
                            user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                          locale:
                            user?.pais.nombre === Paises.españa
                              ? "es-ES"
                              : "en-US",
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {currencyFormat({
                          value: precioLista!,
                          fractionDigits: 2,
                          currency:
                            user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                          locale:
                            user?.pais.nombre === Paises.españa
                              ? "es-ES"
                              : "en-US",
                        })}
                      </span>
                    </>
                  ) : (
                    <span className="text-l font-bold">
                      {currencyFormat({
                        value: precioLista!,
                        fractionDigits: 2,
                        currency:
                          user?.pais.nombre === Paises.españa ? "EUR" : "USD",
                        locale:
                          user?.pais.nombre === Paises.españa
                            ? "es-ES"
                            : "en-US",
                      })}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{producto.nombre}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{producto.modelo}</p>
          {isAdmin ? (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate(
                    routes.producto.path.replace(":productoId", producto.id)
                  );
                }}
              >
                <FilePen className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={onStock}>
                <Package className="mr-2 h-4 w-4" />
                Stock
              </Button>
              <Button variant="outline" size="sm" onClick={onGaleria}>
                <Image className="mr-2 h-4 w-4" />
                Galeria
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={onDetalles}>
                <FilePen className="mr-2 h-4 w-4" />
                Detalles
              </Button>
              <Button variant="outline" size="sm" onClick={onGaleria}>
                <Image className="mr-2 h-4 w-4" />
                Galeria
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
