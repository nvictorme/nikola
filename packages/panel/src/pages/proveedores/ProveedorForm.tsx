import { useProveedoresStore } from "@/store/proveedores.store";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IProveedor } from "shared/interfaces";

const ProveedorForm: React.FC = () => {
  const { proveedor, crearProveedor, actualizarProveedor, hideSheet } =
    useProveedoresStore();

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data: Partial<IProveedor> = {
        nombre: formData.get("nombre") as string,
        marca: formData.get("marca") as string,
        direccion: formData.get("direccion") as string,
        telefono: formData.get("telefono") as string,
        email: formData.get("email") as string,
        notas: formData.get("notas") as string,
      };

      if (proveedor?.id) {
        await actualizarProveedor({ ...proveedor, ...data });
      } else {
        await crearProveedor(data as IProveedor);
      }
      hideSheet();
    },
    [proveedor, crearProveedor, actualizarProveedor, hideSheet]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          name="nombre"
          defaultValue={proveedor?.nombre}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="marca">Marca</Label>
        <Input id="marca" name="marca" defaultValue={proveedor?.marca} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          name="direccion"
          defaultValue={proveedor?.direccion}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          name="telefono"
          defaultValue={proveedor?.telefono}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={proveedor?.email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" defaultValue={proveedor?.notas} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={hideSheet}>
          Cancelar
        </Button>
        <Button type="submit">{proveedor?.id ? "Actualizar" : "Crear"}</Button>
      </div>
    </form>
  );
};

export default ProveedorForm;
