import { DataTable } from "@/components/DataTable";
import { useSucursalesStore } from "@/store/sucursales.store";
import { useEffect, useState } from "react";
import { columnasSucursales } from "./columnas.sucursales";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IAlmacen, IPais, ISucursal } from "shared/interfaces";
import { usePaisesStore } from "@/store/paises.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { Badge } from "@/components/ui/badge";

const SucursalForm = ({
  sucursal,
  onSuccess,
}: {
  sucursal?: ISucursal | null;
  onSuccess: () => void;
}) => {
  const { crearSucursal, actualizarSucursal, isLoading } = useSucursalesStore();
  const { paises, listarTodosLosPaises } = usePaisesStore();
  const { almacenes, setPais } = useAlmacenesStore();
  const [selectedAlmacenes, setSelectedAlmacenes] = useState<IAlmacen[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ISucursal>({
    defaultValues: {
      ...(sucursal ? sucursal : {}),
    },
  });

  useEffect(() => {
    listarTodosLosPaises();
    if (sucursal?.pais) {
      setPais(sucursal.pais.id);
    } else {
      setPais(null);
    }
  }, [listarTodosLosPaises, sucursal?.pais, setPais]);

  useEffect(() => {
    if (sucursal) {
      setValue("nombre", sucursal.nombre);
      setValue("pais", sucursal.pais || null);
      setValue("direccion.calle", sucursal.direccion?.calle || "");
      setValue("direccion.ciudad", sucursal.direccion?.ciudad || "");
      setValue(
        "direccion.codigoPostal",
        sucursal.direccion?.codigoPostal || ""
      );
      setSelectedAlmacenes(sucursal.almacenes || []);
    }
  }, [sucursal, setValue]);

  const onSubmit = async (data: ISucursal) => {
    try {
      const sucursalData = {
        ...data,
        id: sucursal?.id,
        pais: { id: data.pais.id },
        almacenes: selectedAlmacenes,
        impuesto: sucursal?.impuesto || 0,
        impuestoIncluido: sucursal?.impuestoIncluido || false,
        simboloMoneda: sucursal?.simboloMoneda || "$",
        codigoMoneda: sucursal?.codigoMoneda || "USD",
      };

      if (sucursal) {
        await actualizarSucursal(sucursalData as ISucursal);
      } else {
        await crearSucursal(sucursalData as ISucursal);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <Input
          {...register("nombre", { required: "El nombre es requerido" })}
        />
        {errors.nombre && (
          <span className="text-sm text-red-500">{errors.nombre.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">País</label>
        <Select
          defaultValue={sucursal?.pais?.id}
          onValueChange={(value) => {
            setValue("pais", paises.find((p) => p.id === value) as IPais);
            setPais(paises.find((p) => p.id === value)?.id || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un país" />
          </SelectTrigger>
          <SelectContent>
            {paises.map((pais) => (
              <SelectItem key={pais.id} value={pais.id}>
                {pais.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.pais && (
          <span className="text-sm text-red-500">{errors.pais.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Calle</label>
        <Input
          {...register("direccion.calle", {
            required: "La calle es requerida",
          })}
        />
        {errors.direccion?.calle && (
          <span className="text-sm text-red-500">
            {errors.direccion.calle.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ciudad</label>
        <Input
          {...register("direccion.ciudad", {
            required: "La ciudad es requerida",
          })}
        />
        {errors.direccion?.ciudad && (
          <span className="text-sm text-red-500">
            {errors.direccion.ciudad.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Código Postal</label>
        <Input
          {...register("direccion.codigoPostal", {
            required: "El código postal es requerido",
          })}
        />
        {errors.direccion?.codigoPostal && (
          <span className="text-sm text-red-500">
            {errors.direccion.codigoPostal.message}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Almacenes</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedAlmacenes.map((almacen) => (
            <Badge
              key={almacen.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {almacen.nombre}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setSelectedAlmacenes((prev) =>
                    prev.filter((a) => a.id !== almacen.id)
                  )
                }
              />
            </Badge>
          ))}
        </div>
        <Select
          onValueChange={(value) => {
            const almacen = almacenes.find((a) => a.id === value);
            if (
              almacen &&
              !selectedAlmacenes.some((a) => a.id === almacen.id)
            ) {
              setSelectedAlmacenes((prev) => [...prev, almacen]);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleccionar almacén..." />
          </SelectTrigger>
          <SelectContent>
            {almacenes
              .filter((a) => !selectedAlmacenes.some((sa) => sa.id === a.id))
              .map((almacen) => (
                <SelectItem key={almacen.id} value={almacen.id}>
                  {almacen.nombre}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {sucursal ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
};

const SucursalesPage: React.FC = () => {
  const {
    sucursales,
    listarSucursales,
    page,
    limit,
    pageCount,
    setPage,
    setLimit,
    error,
    setPais,
  } = useSucursalesStore();
  const { paises, listarTodosLosPaises } = usePaisesStore();
  const [open, setOpen] = useState(false);
  const [selectedSucursal, setSelectedSucursal] = useState<ISucursal | null>(
    null
  );

  useEffect(() => {
    listarSucursales();
    listarTodosLosPaises();
  }, [listarSucursales, listarTodosLosPaises]);

  const handleEdit = (sucursal: ISucursal) => {
    setSelectedSucursal(sucursal);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedSucursal(null);
    setOpen(false);
  };

  const handleNew = () => {
    setSelectedSucursal(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sucursales</h2>
        <div className="flex items-center gap-4">
          <Select
            defaultValue="Todos"
            onValueChange={(value) => {
              setPais(paises.find((p) => p.id === value) || null);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos los países</SelectItem>
              {paises.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sucursal
              </Button>
            </DialogTrigger>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>
                  {selectedSucursal ? "Editar Sucursal" : "Nueva Sucursal"}
                </DialogTitle>
              </DialogHeader>
              <SucursalForm
                sucursal={selectedSucursal}
                onSuccess={handleClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      <DataTable
        columns={columnasSucursales({ handleEdit })}
        data={sucursales}
        page={page}
        pageCount={pageCount}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
        hideFilter={true}
      />
    </div>
  );
};

export default SucursalesPage;
