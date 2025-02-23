import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReportesStore } from "@/store/reportes.store";
import { differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSucursalesStore } from "@/store/sucursales.store";
import { TipoReporte } from "shared/enums";

export const ReporteVentasPorSucursal = () => {
  const { generarReporte, isLoading } = useReportesStore();
  const { toast } = useToast();
  const { sucursales, listarTodasLasSucursales } = useSucursalesStore();
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [sucursalId, setSucursalId] = useState<string>("");

  const handleGenerar = async () => {
    if (!fechaInicio || !fechaFin) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar un rango de fechas",
      });
      return;
    }

    if (!sucursalId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar una sucursal",
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

    await generarReporte({
      tipo: TipoReporte.ventas,
      formato: "csv",
      fechaInicio: inicio.toISOString(),
      fechaFin: fin.toISOString(),
      sucursalId,
    });
  };

  useEffect(() => {
    listarTodasLasSucursales();
  }, [listarTodasLasSucursales]);

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium mb-4">
          Reporte de Ventas por Sucursal
        </h3>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label className="self-start">Sucursal</Label>
            <Select onValueChange={setSucursalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {sucursales.map((sucursal) => (
                  <SelectItem key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <Label className="self-start">Fecha Inicio</Label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label className="self-start">Fecha Fin</Label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerar}
            disabled={isLoading || !fechaInicio || !fechaFin || !sucursalId}
            className="w-full"
          >
            {isLoading ? "Generando..." : "Generar Reporte"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
