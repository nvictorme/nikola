import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useReportesStore } from "@/store/reportes.store";
import { useToast } from "@/hooks/use-toast";
import { TipoReporte } from "shared/enums";

export const ReporteProductos = () => {
  const { generarReporte, isLoading } = useReportesStore();
  const { toast } = useToast();
  const { handleSubmit } = useForm();

  const onSubmit = async () => {
    try {
      await generarReporte({
        tipo: TipoReporte.productos,
        formato: "csv", // o podríamos dar opción de elegir
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
        <h3 className="text-lg font-medium mb-2">Listado de Productos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Exporta todos los productos ordenados por SKU con sus detalles básicos
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Generando..." : "Generar Reporte"}
          </Button>
        </form>
      </div>
    </Card>
  );
};
