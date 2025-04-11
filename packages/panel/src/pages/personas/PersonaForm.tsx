import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IPersona } from "shared/interfaces";
import { usePersonasStore } from "@/store/personas.store";

export default function PersonaForm() {
  const { persona, crearPersona, actualizarPersona, hideSheet } =
    usePersonasStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<IPersona>({
    defaultValues: persona || {
      creditoHabilitado: false,
      creditoLimite: 0,
    },
  });

  const creditoHabilitado = watch("creditoHabilitado");
  const hasExistingCredit = persona?.creditoHabilitado;

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

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="creditoHabilitado"
            defaultChecked={hasExistingCredit}
            {...register("creditoHabilitado")}
            onCheckedChange={(checked) => {
              setValue("creditoHabilitado", checked as boolean);
            }}
          />
          <Label htmlFor="creditoHabilitado">Habilitar Crédito</Label>
        </div>

        {(creditoHabilitado || hasExistingCredit) && (
          <div>
            <Label htmlFor="creditoLimite">Límite de Crédito</Label>
            <Input
              id="creditoLimite"
              type="number"
              step="0.01"
              {...register("creditoLimite", {
                required: "Límite de crédito es requerido",
                min: { value: 0, message: "El límite debe ser mayor a 0" },
              })}
            />
            {errors.creditoLimite && (
              <span className="text-red-500 text-sm mt-1 block">
                {errors.creditoLimite.message}
              </span>
            )}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full">
        Guardar Cliente
      </Button>
    </form>
  );
}
