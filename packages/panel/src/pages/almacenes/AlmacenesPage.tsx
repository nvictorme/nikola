import { DataTable } from "@/components/DataTable";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { useEffect, useState } from "react";
import { columnasAlmacenes, Almacen } from "./columnas.almacenes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { IAlmacen } from "shared/interfaces";

import { useForm } from "react-hook-form";

const AlmacenForm = ({
  almacen,
  onSuccess,
}: {
  almacen?: Almacen | null;
  onSuccess: () => void;
}) => {
  const { crearAlmacen, actualizarAlmacen, loading } = useAlmacenesStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IAlmacen>({
    defaultValues: {
      ...(almacen
        ? {
            ...almacen,
            direccion: {
              id: almacen.direccion?.id,
              calle: almacen.direccion?.calle || "",
              ciudad: almacen.direccion?.ciudad || "",
              codigoPostal: almacen.direccion?.codigoPostal || "",
            },
          }
        : {}),
    },
  });

  useEffect(() => {
    if (almacen) {
      setValue("nombre", almacen.nombre);
      setValue("direccion.calle", almacen.direccion?.calle || "");
      setValue("direccion.ciudad", almacen.direccion?.ciudad || "");
      setValue("direccion.codigoPostal", almacen.direccion?.codigoPostal || "");
      if (almacen.direccion?.id) {
        setValue("direccion.id", almacen.direccion.id);
      }
    }
  }, [almacen, setValue]);

  const onSubmit = async (data: IAlmacen) => {
    try {
      const almacenData = {
        ...data,
        id: almacen?.id,
      };

      if (almacen) {
        await actualizarAlmacen(almacenData as IAlmacen);
      } else {
        await crearAlmacen(almacenData as IAlmacen);
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

      <Button type="submit" disabled={loading}>
        {almacen ? "Actualizar" : "Crear"}
      </Button>
    </form>
  );
};

const AlmacenesPage: React.FC = () => {
  const { almacenes, page, pageCount, limit, setPage, setLimit } =
    useAlmacenesStore();

  const [open, setOpen] = useState(false);
  const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);

  const handleEdit = (almacen: Almacen) => {
    setSelectedAlmacen(almacen);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedAlmacen(null);
    setOpen(false);
  };

  const handleNew = () => {
    setSelectedAlmacen(null);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Almacenes</h2>
        <div className="flex items-center gap-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Almacén
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedAlmacen ? "Editar Almacén" : "Nuevo Almacén"}
                </DialogTitle>
              </DialogHeader>
              <AlmacenForm almacen={selectedAlmacen} onSuccess={handleClose} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        columns={columnasAlmacenes({ handleEdit })}
        data={almacenes}
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

export default AlmacenesPage;
