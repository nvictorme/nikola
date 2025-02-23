import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrdenesStore } from "@/store/ordenes.store";
import { IOrden } from "shared/interfaces";
import { Transportistas } from "shared/enums";

export const EnvioForm = ({
  orden,
  onOpenChange,
}: {
  orden: IOrden;
  onOpenChange: (open: boolean) => void;
}) => {
  const { agregarEnvio } = useOrdenesStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    await agregarEnvio({
      ordenId: orden.id,
      envio: {
        transportista: formData.get("transportista") as Transportistas,
        tracking: formData.get("tracking") as string,
        notas: formData.get("notas") as string,
      },
    });

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transportista">Transportista</Label>
        <Select name="transportista" required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar transportista" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Transportistas).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tracking">Número de tracking</Label>
        <Input name="tracking" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea name="notas" />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          Guardar
        </Button>
      </div>
    </form>
  );
};
