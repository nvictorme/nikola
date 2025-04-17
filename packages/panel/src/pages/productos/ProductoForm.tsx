import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import {
  IProducto,
  IDimensiones,
  ICategoria,
  ISubcategoria,
} from "shared/interfaces";
import { UnidadesLongitud, UnidadesPeso } from "shared/enums";
import { Textarea } from "@/components/ui/textarea";
import { useProductosStore } from "@/store/productos.store";
import { useCategoriasStore } from "@/store/categorias.store";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { ApiClient } from "@/api/api.client";
import { useParams, useNavigate } from "react-router-dom";
import { routes } from "@/navigation/routes";
import { Checkbox } from "@/components/ui/checkbox";

// Form type that only includes the fields we need
interface ProductoFormData {
  nombre: string;
  descripcion: string;
  modelo: string;
  sku: string;
  upc?: string;
  ean?: string;
  isbn?: string;
  categoria: { id: string };
  subcategoria?: { id: string };
  garantia: string;
  costo: number;
  precioGeneral: number;
  precioInstalador: number;
  precioMayorista: number;
  enOferta: boolean;
  precioOferta?: number;
  inicioOferta?: string | null;
  finOferta?: string | null;
  dimensiones: IDimensiones;
  embalaje: IDimensiones;
  stockMinimo: number;
}

export default function ProductoForm() {
  const { productoId } = useParams();
  const [producto, setProducto] = useState<IProducto | null>(null);
  const [loading, setLoading] = useState(false);

  const { categorias, subcategorias, listarCategorias, listarSubcategorias } =
    useCategoriasStore();
  const { crearProducto, actualizarProducto } = useProductosStore();

  const navigate = useNavigate();

  useEffect(() => {
    if (productoId && productoId !== "nuevo") {
      setLoading(true);
      new ApiClient()
        .get(`/productos/${productoId}`, {})
        .then(({ data }) => {
          setProducto(data.producto);
          if (data.producto?.categoria?.id) {
            listarSubcategorias(data.producto.categoria.id);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [productoId, listarSubcategorias]);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductoFormData>({
    defaultValues: {
      nombre: producto?.nombre || "",
      descripcion: producto?.descripcion || "",
      modelo: producto?.modelo || "",
      sku: producto?.sku || "",
      upc: producto?.upc,
      ean: producto?.ean,
      isbn: producto?.isbn,
      categoria: producto?.categoria || { id: "" },
      subcategoria: producto?.subcategoria,
      garantia: producto?.garantia || "",
      costo: producto?.costo || 0,
      precioGeneral: producto?.precioGeneral || 0,
      precioInstalador: producto?.precioInstalador || 0,
      precioMayorista: producto?.precioMayorista || 0,
      enOferta: producto?.enOferta || false,
      precioOferta: producto?.precioOferta,
      inicioOferta: producto?.inicioOferta,
      finOferta: producto?.finOferta,
      stockMinimo: producto?.stockMinimo || 0,
      dimensiones: {
        largo: producto?.dimensiones?.largo || 0,
        ancho: producto?.dimensiones?.ancho || 0,
        alto: producto?.dimensiones?.alto || 0,
        peso: producto?.dimensiones?.peso || 0,
        unidadLongitud:
          producto?.dimensiones?.unidadLongitud || UnidadesLongitud.cm,
        unidadPeso: producto?.dimensiones?.unidadPeso || UnidadesPeso.g,
      },
      embalaje: {
        largo: producto?.embalaje?.largo || 0,
        ancho: producto?.embalaje?.ancho || 0,
        alto: producto?.embalaje?.alto || 0,
        peso: producto?.embalaje?.peso || 0,
        unidadLongitud:
          producto?.embalaje?.unidadLongitud || UnidadesLongitud.cm,
        unidadPeso: producto?.embalaje?.unidadPeso || UnidadesPeso.g,
      },
    },
  });

  // onSubmit handler
  const onSubmit = handleSubmit((formData) => {
    const productoData: Partial<IProducto> = {
      ...formData,
      categoria:
        producto?.categoria || ({ id: formData.categoria.id } as ICategoria),
      subcategoria: formData.subcategoria
        ? ({ id: formData.subcategoria.id } as ISubcategoria)
        : undefined,
      stock: producto?.stock || [],
      portada: producto?.portada,
      galeria: producto?.galeria || [],
    };

    if (producto) {
      actualizarProducto({
        ...producto,
        ...productoData,
      } as IProducto);
    } else {
      crearProducto(productoData as IProducto);
    }
    navigate(routes.productos.path);
  });

  // watch values
  const nombre = watch("nombre");

  // useEffect to list categorias and paises
  useEffect(() => {
    listarCategorias();
    if (producto?.categoria?.id) {
      listarSubcategorias(producto.categoria.id);
    }
    return () => {
      reset();
    };
  }, [listarCategorias, reset, producto?.categoria?.id, listarSubcategorias]);

  useEffect(() => {
    if (producto) {
      reset(producto);
    }
  }, [producto, reset]);

  if (loading) return <Spinner />;

  return (
    <Card className="bg-background max-w-[600px] m-auto">
      <CardHeader>
        <CardTitle>{nombre || "Nuevo Producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl mx-auto">
          <div className="flex flex-col items-start gap-1">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              type="text"
              {...register("nombre", { required: "Este campo es requerido" })}
            />
            {errors.nombre && (
              <p className="text-red-500 text-sm mt-1">
                {errors.nombre.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                type="text"
                {...register("modelo", { required: "Este campo es requerido" })}
              />
              {errors.modelo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.modelo.message}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                type="text"
                {...register("sku", { required: "Este campo es requerido" })}
              />
              {errors.sku && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.sku.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="costo">Costo</Label>
              <Input
                id="costo"
                type="number"
                step="0.01"
                {...register("costo", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "El costo debe ser mayor o igual a 0",
                  },
                })}
              />
              {errors.costo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.costo.message}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="precioGeneral">Precio General</Label>
              <Input
                id="precioGeneral"
                type="number"
                step="0.01"
                defaultValue={producto?.precioGeneral}
                {...register("precioGeneral", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "El precio debe ser mayor o igual a 0",
                  },
                })}
              />
              {errors.precioGeneral && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.precioGeneral.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="precioInstalador">Precio Instalador</Label>
              <Input
                id="precioInstalador"
                type="number"
                step="0.01"
                defaultValue={producto?.precioInstalador}
                {...register("precioInstalador", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "El precio debe ser mayor o igual a 0",
                  },
                })}
              />
              {errors.precioInstalador && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.precioInstalador.message}
                </p>
              )}
            </div>

            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="precioMayorista">Precio Mayorista</Label>
              <Input
                id="precioMayorista"
                type="number"
                step="0.01"
                defaultValue={producto?.precioMayorista}
                {...register("precioMayorista", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "El precio debe ser mayor o igual a 0",
                  },
                })}
              />
              {errors.precioMayorista && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.precioMayorista.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="enOferta">En Oferta</Label>
              <Controller
                name="enOferta"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          {watch("enOferta") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-start gap-1">
                <Label htmlFor="precioOferta">Precio Oferta</Label>
                <Input
                  id="precioOferta"
                  type="number"
                  step="0.01"
                  defaultValue={producto?.precioOferta}
                  {...register("precioOferta", {
                    required:
                      "Este campo es requerido cuando el producto está en oferta",
                    valueAsNumber: true,
                  })}
                />
                {errors.precioOferta && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.precioOferta.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-1">
                <Label htmlFor="inicioOferta">Inicio Oferta</Label>
                <Input
                  id="inicioOferta"
                  type="date"
                  value={
                    watch("inicioOferta")
                      ? new Date(watch("inicioOferta") as string)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    setValue(
                      "inicioOferta",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null
                    );
                  }}
                />
                {errors.inicioOferta && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.inicioOferta.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-1">
                <Label htmlFor="finOferta">Fin Oferta</Label>
                <Input
                  id="finOferta"
                  type="date"
                  value={
                    watch("finOferta")
                      ? new Date(watch("finOferta") as string)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    setValue(
                      "finOferta",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null
                    );
                  }}
                  min={
                    watch("inicioOferta")
                      ? new Date(watch("inicioOferta") as string)
                          .toISOString()
                          .split("T")[0]
                      : undefined
                  }
                />
                {errors.finOferta && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.finOferta.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="garantia">Garantía</Label>
              <Input
                id="garantia"
                defaultValue={producto?.garantia || "Sin Garantía"}
                type="text"
                {...register("garantia")}
              />
            </div>
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="stockMinimo">Stock Mínimo</Label>
              <Input
                id="stockMinimo"
                type="number"
                min="0"
                step="1"
                defaultValue={producto?.stockMinimo || 0}
                {...register("stockMinimo", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                  min: {
                    value: 0,
                    message: "El stock mínimo debe ser mayor o igual a 0",
                  },
                })}
              />
              {errors.stockMinimo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.stockMinimo.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2 w-full mt-4">
                <Label>Categoría</Label>
                <Controller
                  name="categoria"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value?.id || ""}
                      onValueChange={(val) => {
                        const selectedCategoria = categorias.find(
                          (c) => c.id === val
                        );
                        field.onChange(selectedCategoria);
                        listarSubcategorias(val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <div className="flex flex-col gap-2 w-full mt-4">
                <Label>Subcategoría</Label>
                <Controller
                  name="subcategoria"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={!subcategorias.length}
                      value={field.value?.id || ""}
                      onValueChange={(val) => {
                        const selectedSubcategoria = subcategorias.find(
                          (s) => s.id === val
                        );
                        field.onChange(selectedSubcategoria);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Subcategoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategorias.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div>
            <Controller
              name="dimensiones"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-lg font-semibold w-full text-left border-b pb-2">
                    Dimensiones del Producto
                  </div>
                  <div className="flex flex-row">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="largo">Largo</Label>
                        <Input
                          id="largo"
                          type="number"
                          value={field.value?.largo || 0}
                          {...register("dimensiones.largo", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.dimensiones?.largo && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.dimensiones.largo.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="ancho">Ancho</Label>
                        <Input
                          id="ancho"
                          type="number"
                          value={field.value?.ancho || 0}
                          {...register("dimensiones.ancho", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.dimensiones?.ancho && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.dimensiones.ancho.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="alto">Alto</Label>
                        <Input
                          id="alto"
                          type="number"
                          value={field.value?.alto || 0}
                          {...register("dimensiones.alto", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.dimensiones?.alto && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.dimensiones.alto.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="unidadLongitud">
                          Unidad de Longitud
                        </Label>
                        <Select
                          defaultValue={
                            producto?.dimensiones?.unidadLongitud || "cm"
                          }
                          onValueChange={(val) => {
                            field.onChange({
                              ...field.value,
                              unidadLongitud: val,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidad de Longitud" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UnidadesLongitud).map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 col-span-1">
                        <Label htmlFor="peso">Peso</Label>
                        <Input
                          id="peso"
                          type="number"
                          value={field.value?.peso || 0}
                          {...register("dimensiones.peso", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.dimensiones?.peso && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.dimensiones.peso.message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 col-span-1">
                        <Label htmlFor="unidadPeso">Unidad de Peso</Label>
                        <Select
                          defaultValue={
                            producto?.dimensiones?.unidadPeso ?? "g"
                          }
                          onValueChange={(val) => {
                            field.onChange({
                              ...field.value,
                              unidadPeso: val,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidad de Peso" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UnidadesPeso).map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          <div>
            <Controller
              name="embalaje"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-lg font-semibold w-full text-left border-b pb-2">
                    Dimensiones del Embalaje
                  </div>
                  <div className="flex flex-row">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="largo">Largo</Label>
                        <Input
                          id="largo"
                          type="number"
                          value={field.value?.largo || 0}
                          {...register("embalaje.largo", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.embalaje?.largo && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.embalaje.largo.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="ancho">Ancho</Label>
                        <Input
                          id="ancho"
                          type="number"
                          value={field.value?.ancho || 0}
                          {...register("embalaje.ancho", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.embalaje?.ancho && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.embalaje.ancho.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="alto">Alto</Label>
                        <Input
                          id="alto"
                          type="number"
                          value={field.value?.alto || 0}
                          {...register("embalaje.alto", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.embalaje?.alto && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.embalaje.alto.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-start gap-1 col-span-1">
                        <Label htmlFor="unidadLongitud">
                          Unidad de Longitud
                        </Label>
                        <Select
                          defaultValue={
                            producto?.embalaje?.unidadLongitud || "cm"
                          }
                          onValueChange={(val) => {
                            field.onChange({
                              ...field.value,
                              unidadLongitud: val,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidad de Longitud" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UnidadesLongitud).map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 col-span-1">
                        <Label htmlFor="peso">Peso</Label>
                        <Input
                          id="peso"
                          type="number"
                          value={field.value?.peso || 0}
                          {...register("embalaje.peso", {
                            valueAsNumber: true,
                            min: {
                              value: 0,
                              message: "El valor debe ser mayor o igual a 0",
                            },
                          })}
                        />
                        {errors.embalaje?.peso && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.embalaje.peso.message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 col-span-1">
                        <Label htmlFor="unidadPeso">Unidad de Peso</Label>
                        <Select
                          defaultValue={producto?.embalaje?.unidadPeso ?? "kg"}
                          onValueChange={(val) => {
                            field.onChange({
                              ...field.value,
                              unidadPeso: val,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidad de Peso" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UnidadesPeso).map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          <div className="flex flex-col items-start gap-1 col-span-6">
            <div className="text-lg font-semibold w-full text-left pb-2">
              Descripción del Producto
            </div>
            <Textarea
              id="descripcion"
              rows={4}
              {...register("descripcion")}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="link"
              onClick={() => navigate(routes.productos.path)}
              className="text-red-500"
              type="reset"
            >
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
