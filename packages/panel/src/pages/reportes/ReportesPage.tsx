import { useReportesStore } from "@/store/reportes.store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, TrashIcon } from "lucide-react";
import { ReporteProductos } from "./ReporteProductos";
import { ReporteProductosPorPais } from "./ReporteProductosPorPais";
import { ReporteVentasTotales } from "./ReporteVentasTotales";
import { ReporteVentasPorSucursal } from "./ReporteVentasPorSucursal";

const ReportesPage: React.FC = () => {
  const { reportes, removeReporte } = useReportesStore();

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ReporteVentasTotales />
        <ReporteVentasPorSucursal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ReporteProductos />
        <ReporteProductosPorPais />
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Reportes Generados</h3>
          <div className="space-y-2">
            {reportes.map((reporte) => (
              <div
                key={reporte.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{reporte.nombre}</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(reporte.url, "_blank")}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReporte(reporte.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {reportes.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No hay reportes generados
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportesPage;
