import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { useReportesStore } from "@/store/reportes.store";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePaisesStore } from "@/store/paises.store";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { TipoReporte } from "shared/enums";

type FormValues = {
  paisId: string;
};

export const ReporteProductosPorPais = () => {
  const { generarReporte, isLoading } = useReportesStore();
  const { paises, listarTodosLosPaises } = usePaisesStore();
  const { toast } = useToast();
  const { control, handleSubmit, watch } = useForm<FormValues>();

  const paisId = watch("paisId");

  useEffect(() => {
    listarTodosLosPaises();
  }, [listarTodosLosPaises]);

  const onSubmit = async (values: FormValues) => {
    try {
      await generarReporte({
        tipo: TipoReporte.productos,
        formato: "csv",
        paisId: values.paisId,
      });
      toast({
        title: "Éxito",
        description: "Reporte generado exitosamente",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-2">Productos por País</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Exporta los productos con sus precios específicos por país
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label className="self-start">País</Label>
            <Controller
              control={control}
              name="paisId"
              rules={{ required: "Este campo es requerido" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
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
          </div>
          <Button
            type="submit"
            disabled={isLoading || !paisId}
            className="w-full"
          >
            {isLoading ? "Generando..." : "Generar Reporte"}
          </Button>
        </form>
      </div>
    </Card>
  );
};
