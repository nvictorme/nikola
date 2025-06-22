import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IPersona } from "shared/interfaces";
import { TipoCliente } from "shared/enums";
import { usePersonasStore } from "@/store/personas.store";

export default function PersonaForm() {
  const { persona, crearPersona, actualizarPersona, hideSheet, personas } =
    usePersonasStore((state) => ({
      persona: state.persona,
      crearPersona: state.crearPersona,
      actualizarPersona: state.actualizarPersona,
      hideSheet: state.hideSheet,
      personas: state.personas,
    }));

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
      tipoCliente: TipoCliente.general,
    },
  });

  const creditoHabilitado = watch("creditoHabilitado");
  const hasExistingCredit = persona?.creditoHabilitado;

  // Genera un email único basado en nif y nombre, asegurando que no se repita en la lista de personas
  function generarEmailUnico(nif: string, nombre: string): string {
    const base = `${nif}@${nombre}.com`.replace(/\s+/g, "").toLowerCase();
    let email = base;
    let i = 1;
    // Si el email ya existe, agrega un número incremental al final
    while (personas.some((p) => p.email === email)) {
      email = `${nif}@${nombre}${i}.com`.replace(/\s+/g, "").toLowerCase();
      i++;
    }
    return email;
  }

  // onSubmit: lógica de guardado, pero el email ya estará seteado por el handler personalizado
  const onSubmit = (data: IPersona) => {
    // Si el email está vacío, se genera automáticamente (esto normalmente no ocurre porque el handler ya lo setea)
    if (!data.email || data.email.trim() === "") {
      data.email = generarEmailUnico(data.nif, data.nombre);
    }
    if (persona) {
      actualizarPersona(data);
    } else {
      crearPersona(data);
    }
    hideSheet();
  };

  // Handler personalizado para submit:
  // Antes de validar, si el campo email está vacío, lo genera y lo setea usando setValue,
  // luego ejecuta el submit real con los datos ya completos.
  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = watch(); // Obtiene los valores actuales del formulario
    if (!values.email || values.email.trim() === "") {
      // Si el email está vacío, lo genera automáticamente
      const autoEmail = generarEmailUnico(values.nif, values.nombre);
      setValue("email", autoEmail, { shouldValidate: true });
      // Espera a que setValue actualice el valor antes de continuar con el submit
      setTimeout(() => handleSubmit(onSubmit)(e), 0);
    } else {
      // Si ya hay email, simplemente ejecuta el submit normal
      handleSubmit(onSubmit)(e);
    }
  };

  return (
    <form
      onSubmit={handleCustomSubmit} // Handler personalizado para controlar el email
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
        <Label htmlFor="tipoCliente">Tipo de Cliente</Label>
        <Select
          defaultValue={persona?.tipoCliente || TipoCliente.general}
          onValueChange={(value) =>
            setValue("tipoCliente", value as TipoCliente)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un tipo de cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TipoCliente.instalador}>Instalador</SelectItem>
            <SelectItem value={TipoCliente.mayorista}>Mayorista</SelectItem>
            <SelectItem value={TipoCliente.general}>General</SelectItem>
          </SelectContent>
        </Select>
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
