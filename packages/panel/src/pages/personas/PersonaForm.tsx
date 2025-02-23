import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IPersona } from "shared/interfaces";
import { usePersonasStore } from "@/store/personas.store";
import { usePaisesStore } from "@/store/paises.store";
import { useEffect } from "react";

export default function PersonaForm() {
  const { persona, crearPersona, actualizarPersona, hideSheet } =
    usePersonasStore();

  const { paises, listarTodosLosPaises } = usePaisesStore();

  useEffect(() => {
    listarTodosLosPaises();
  }, [listarTodosLosPaises]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<IPersona>({
    defaultValues: persona || {},
  });

  const onSubmit = (data: IPersona) => {
    if (persona) {
      actualizarPersona(data);
    } else {
      crearPersona(data);
    }
    hideSheet();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email", { required: "Email es requerido" })}
        />
        {errors.email && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.email.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          {...register("nombre", { required: "Nombre es requerido" })}
        />
        {errors.nombre && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.nombre.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="apellido">Apellido</Label>
        <Input
          id="apellido"
          {...register("apellido", { required: "Apellido es requerido" })}
        />
        {errors.apellido && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.apellido.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="empresa">Empresa</Label>
        <Input id="empresa" {...register("empresa")} />
      </div>

      <div>
        <Label htmlFor="nif">NIF (Cédula, RIF, DNI, NIT, ITIN, etc.)</Label>
        <Input
          id="nif"
          {...register("nif", { required: "NIF es requerido" })}
        />
        {errors.nif && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.nif.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register("telefono")} />
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" {...register("notas")} />
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Controller
          name="pais"
          control={control}
          rules={{ required: "País es requerido" }}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value?.id}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un país" />
              </SelectTrigger>
              <SelectContent>
                {paises.map((pais) => (
                  <SelectItem key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.pais && (
          <span className="text-red-500 text-sm mt-1 block">
            {errors.pais.message}
          </span>
        )}
      </div>

      <Button type="submit" className="w-full">
        Guardar Cliente
      </Button>
    </form>
  );
}
