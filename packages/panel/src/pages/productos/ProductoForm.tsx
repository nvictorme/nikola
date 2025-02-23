import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { periodosGarantia } from "shared/constants";
import { IPais, IProducto } from "shared/interfaces";
import { PeriodosGarantia, UnidadesLongitud, UnidadesPeso } from "shared/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ProductSelector from "./ProductoSelector";
import { Textarea } from "@/components/ui/textarea";
import { useProductosStore } from "@/store/productos.store";
import { useCategoriasStore } from "@/store/categorias.store";
import { usePaisesStore } from "@/store/paises.store";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { ApiClient } from "@/api/api.client";
import { useParams, useNavigate } from "react-router-dom";
import { routes } from "@/navigation/routes";

export default function ProductoForm() {
  const { productoId } = useParams();
  const [producto, setProducto] = useState<IProducto | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMotoresDialogOpen, setIsMotoresDialogOpen] = useState(false);

  const { categorias, subcategorias, listarCategorias, listarSubcategorias } =
    useCategoriasStore();
  const { paises, listarTodosLosPaises } = usePaisesStore();
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
  } = useForm<IProducto>({
    defaultValues: producto || {},
  });

  // onSubmit handler
  const onSubmit = handleSubmit((data) => {
    if (producto) {
      actualizarProducto({ ...producto, ...data });
    } else {
      crearProducto(data);
    }
    navigate(routes.productos.path);
  });

  // watch values
  const nombre = watch("nombre");
  const requiereMotor = watch("requiereMotor");
  const motores = watch("motores");

  // useEffect to list categorias and paises
  useEffect(() => {
    listarCategorias();
    listarTodosLosPaises();
    if (producto?.categoria?.id) {
      listarSubcategorias(producto.categoria.id);
    }
    return () => {
      reset();
    };
  }, [
    listarCategorias,
    listarTodosLosPaises,
    reset,
    producto?.categoria?.id,
    listarSubcategorias,
  ]);

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

          <div className="grid grid-cols-2 gap-4">
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

            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="costo">Costo</Label>
              <Input
                id="costo"
                type="number"
                step="0.01"
                {...register("costo", {
                  required: "Este campo es requerido",
                  valueAsNumber: true,
                })}
              />
              {errors.costo && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.costo.message}
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

          <div className="grid grid-cols-3 gap-3 items-center">
            <div className="flex flex-col">
              <div className="flex flex-col gap-2 w-full mt-4">
                <Controller
                  name="garantia"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                      }}
                      defaultValue={
                        producto?.garantia || PeriodosGarantia.sin_garantia
                      }
                    >
                      <SelectTrigger>
                        <Label>Garantia</Label>
                        <SelectValue placeholder="Garantia" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodosGarantia.map((g) => (
                          <SelectItem key={g} {...field} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <Controller
                name="requiereMotor"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2 justify-center">
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="requiereMotor">Requiere motor?</Label>
                  </div>
                )}
              />
            </div>
            <div className="flex flex-col">
              <Dialog
                open={isMotoresDialogOpen}
                onOpenChange={setIsMotoresDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={!requiereMotor}
                  >
                    Seleccionar Motores
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Seleccione Motores</DialogTitle>
                    <DialogDescription>
                      <Controller
                        name="motores"
                        control={control}
                        render={({ field }) => (
                          <ProductSelector
                            soloMotores
                            onSelected={(motores) => {
                              field.onChange(
                                motores.map((m) => ({
                                  motor: m,
                                  cantidad: 1,
                                }))
                              );
                              setIsMotoresDialogOpen(false);
                            }}
                            initialSelected={producto?.motores?.map(
                              (m) => m.motor
                            )}
                          />
                        )}
                      />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Add the motors display section */}
          {requiereMotor && motores?.length > 0 ? (
            <div className="flex flex-col gap-2">
              <Label>Motores Seleccionados</Label>
              <div className="space-y-2">
                {motores?.map((motor) => (
                  <div
                    key={motor.motor.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{motor.motor.nombre}</span>
                    <div className="flex items-center gap-2">
                      <Label>Cantidad:</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-20"
                        value={motor.cantidad}
                        onChange={(e) => {
                          const value = Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          );
                          const newMotores = watch("motores").map((m) =>
                            m.motor.id === motor.motor.id
                              ? {
                                  ...m,
                                  cantidad: value,
                                }
                              : m
                          );
                          setValue("motores", newMotores);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 px-2"
                        onClick={() => {
                          const newMotores = watch("motores").filter(
                            (m) => m.motor.id !== motor.motor.id
                          );
                          setValue("motores", newMotores);
                        }}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

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
                          {...register("dimensiones.largo", {
                            required: "Este campo es requerido",
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
                          {...register("dimensiones.ancho", {
                            required: "Este campo es requerido",
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
                          {...register("dimensiones.alto", {
                            required: "Este campo es requerido",
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
                          {...register("dimensiones.peso", {
                            required: "Este campo es requerido",
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
                            producto?.dimensiones?.unidadPeso ?? "kg"
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
                          {...register("embalaje.largo", {
                            required: "Este campo es requerido",
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
                          {...register("embalaje.ancho", {
                            required: "Este campo es requerido",
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
                          {...register("embalaje.alto", {
                            required: "Este campo es requerido",
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
                          {...register("embalaje.peso", {
                            required: "Este campo es requerido",
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
              {...register("descripcion", {
                required: "Este campo es requerido",
              })}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">
                {errors.descripcion.message}
              </p>
            )}
          </div>

          <div>
            <div className="text-lg font-semibold w-full text-left border-b pb-2">
              Países de Comercialización
            </div>
            <Controller
              name="paises"
              control={control}
              render={({ field }) => (
                <div className="flex flex-row gap-4 flex-wrap mt-4">
                  {paises.map((p: IPais) => (
                    <div
                      key={`pais-${p.id}`}
                      className="flex gap-1 align-middle items-start"
                    >
                      <Checkbox
                        checked={field.value?.some((pais) => pais.id === p.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange(field.value?.concat(p) || [p])
                            : field.onChange(
                                field.value?.filter((pais) => pais.id !== p.id)
                              );
                        }}
                      />
                      <Label htmlFor={`pais-${p}`}>{p.nombre}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
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
