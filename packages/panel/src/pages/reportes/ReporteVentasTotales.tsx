import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReportesStore } from "@/store/reportes.store";
import { differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TipoReporte } from "shared/enums";

export const ReporteVentasTotales = () => {
  const { generarReporte, isLoading, error } = useReportesStore();
  const { toast } = useToast();
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const handleGenerar = async () => {
    if (!fechaInicio || !fechaFin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un rango de fechas",
      });
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (inicio > fin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La fecha de inicio debe ser menor a la fecha final",
      });
      return;
    }

    const dias = differenceInDays(fin, inicio);
    if (dias > 90) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El rango máximo es de 90 días",
      });
      return;
    }

    try {
      await generarReporte({
        tipo: TipoReporte.ventas,
        formato: "csv",
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      });

      toast({
        title: "Éxito",
        description: "Reporte generado correctamente",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    }
  };

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error, toast]);

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">Reporte de Ventas Totales</h3>

        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label className="self-start">Fecha Inicio</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              max={fechaFin || undefined}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label className="self-start">Fecha Fin</Label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio || undefined}
            />
          </div>

          <Button
            onClick={handleGenerar}
            disabled={isLoading || !fechaInicio || !fechaFin}
            className="w-full"
          >
            {isLoading ? "Generando..." : "Generar Reporte"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
