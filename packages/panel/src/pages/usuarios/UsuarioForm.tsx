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
import { IUsuario } from "shared/interfaces";
import { useUsuariosStore } from "@/store/usuarios.store";
import { Checkbox } from "@/components/ui/checkbox";
import { useRolesStore } from "@/store/roles.store";
import { useEffect } from "react";
import { useSucursalesStore } from "@/store/sucursales.store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePaisesStore } from "@/store/paises.store";

export default function UsuarioForm() {
  const { usuario, crearUsuario, actualizarUsuario, hideSheet } =
    useUsuariosStore();

  const { roles, listarRoles } = useRolesStore();

  const { sucursales, listarSucursalesPorPais } = useSucursalesStore();

  const { paises, listarTodosLosPaises } = usePaisesStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<IUsuario>({
    defaultValues: usuario || {},
  });

  const pais = watch("pais");

  const onSubmit = (data: IUsuario) => {
    if (usuario) {
      actualizarUsuario(data);
    } else {
      crearUsuario(data);
    }
    hideSheet();
  };

  // cargar roles
  useEffect(() => {
    if (!roles.length) listarRoles();
  }, [roles, listarRoles]);

  // cargar sucursales por pais
  useEffect(() => {
    if (pais) listarSucursalesPorPais(pais);
  }, [pais, listarSucursalesPorPais]);

  // cargar paises
  useEffect(() => {
    listarTodosLosPaises();
  }, [listarTodosLosPaises]);

  if (!paises.length) return null;

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
          <span className="text-red-500 text-sm mt-1">
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
          <span className="text-red-500 text-sm mt-1">
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
          <span className="text-red-500 text-sm mt-1">
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
          <span className="text-red-500 text-sm mt-1">
            {errors.nif.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...register("telefono")} />
      </div>

      <div>
        <Label htmlFor="rol">Rol</Label>
        <Controller
          name="rol"
          control={control}
          rules={{ required: "Rol es requerido" }}
          render={({ field }) => (
            <Select
              onValueChange={(value) => {
                const r = roles.find((rol) => rol.nombre === value);
                field.onChange(r);
              }}
              defaultValue={field.value?.nombre}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elige un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.nombre}>
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.rol && (
          <span className="text-red-500 text-sm mt-1">
            {errors.rol.message}
          </span>
        )}
      </div>

      <div>
        <Label htmlFor="pais">País</Label>
        <Controller
          name="pais"
          control={control}
          rules={{ required: "País es requerido" }}
          render={({ field }) => (
            <Select
              onValueChange={(value) => {
                const selectedPais = paises.find((p) => p.id === value);
                field.onChange(selectedPais);
              }}
              defaultValue={field.value?.id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Elige un país" />
              </SelectTrigger>
              <SelectContent>
                {paises?.map((pais) => (
                  <SelectItem key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.pais && (
          <span className="text-red-500 text-sm mt-1">
            {errors.pais.message}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Popover modal>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" disabled={!pais}>
              Seleccionar Sucursales
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">
                  Sucursales en {pais?.nombre}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Seleccione las sucursales a las que tiene acceso el usuario
                </p>
              </div>
              <Controller
                name="sucursales"
                control={control}
                render={({ field }) => (
                  <div>
                    {sucursales.map((s) => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={s.id}
                          defaultChecked={
                            !!usuario?.sucursales?.find((us) => us.id === s.id)
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const newSucursales = field.value || [];
                              // Only add if not already present
                              if (!newSucursales.find((us) => us.id === s.id)) {
                                field.onChange([...newSucursales, s]);
                              }
                            } else {
                              field.onChange(
                                (field.value || []).filter(
                                  (us) => us.id !== s.id
                                )
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={s.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {s.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="exw"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="exw"
              defaultChecked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label
          htmlFor="exw"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Habilitar EXW
        </Label>
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" {...register("notas")} />
      </div>

      <Button type="submit" className="w-full">
        Guardar Usuario
      </Button>
    </form>
  );
}
