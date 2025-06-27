// =============================
// Cambios realizados en este archivo:
// - Se descomentó y agregó fetchChartsData al useDashboardStore y al useEffect de montaje para asegurar la actualización de los datos de gráficos (ventas diarias, reposiciones, etc.).
// - Se agregó un log para mostrar el contenido de charts.dailySales y facilitar la depuración de ventas diarias.
// - Se mantiene fetchDeudores y fetchDashboardData en el useEffect para asegurar la actualización de la lista de deudores y totales de deuda.
// - El cálculo de Total Ventas del Día ahora suma todas las ventas del día actual presentes en charts.dailySales.
// =============================
// =============================
// Cambios realizados en este archivo:
// - Se agregó una nueva fila de MetricCards para mostrar la valoración de inventario (COSTO y VENTA)
//   justo debajo de la fila de "Total General de Deuda de Clientes" y "Total Reposicion Mes",
//   manteniendo el mismo ancho y estilo visual.
// - Se corrigió el uso de los íconos en los nuevos MetricCards para que sean visibles y consistentes.
// - Se utiliza currencyFormat para mostrar los totales de inventario de forma consistente con el resto del dashboard.
// - Se recomienda verificar que el array de productos y sus stocks estén correctamente cargados para evitar totales en cero.
// - Se agregó un MetricCard "Cantidad de Productos Registrados" que ahora muestra el total real de productos usando el valor 'total' del store, no solo la cantidad de la página actual.
// - Se cambió el icono de este MetricCard a 'Package' de Lucide para mayor claridad visual.
//   Puedes ver y elegir otros iconos en https://lucide.dev/icons/
// =============================

import React from "react";
import { useDashboardStore } from "../../store/dashboard.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  BanknoteIcon,
  BarChart2,
  AlertCircle,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currencyFormat } from "shared/helpers";
import { LineChart, BarChart, PieChart } from "@/components/ui/charts";
import { useTheme } from "next-themes";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IPersona } from "shared/interfaces";
import { useProductosStore } from "../../store/productos.store";
import { useAlmacenesStore } from "../../store/almacenes.store";

const CHART_COLORS = {
  light: {
    primary: "rgba(59, 130, 246, 0.7)", // lighter blue
    secondary: "rgba(14, 165, 233, 0.7)", // lighter sky blue
    accent: "rgba(139, 92, 246, 0.7)", // lighter purple
    success: "rgba(34, 197, 94, 0.7)", // lighter green
    warning: "rgba(245, 158, 11, 0.7)", // lighter amber
    error: "rgba(239, 68, 68, 0.7)", // lighter red
    muted: "rgba(148, 163, 184, 0.7)", // lighter slate
    background: "rgba(248, 250, 252, 0.9)", // lighter slate
  },
  dark: {
    primary: "rgba(96, 165, 250, 0.7)", // darker blue
    secondary: "rgba(56, 189, 248, 0.7)", // darker sky blue
    accent: "rgba(167, 139, 250, 0.7)", // darker purple
    success: "rgba(74, 222, 128, 0.7)", // darker green
    warning: "rgba(251, 191, 36, 0.7)", // darker amber
    error: "rgba(248, 113, 113, 0.7)", // darker red
    muted: "rgba(148, 163, 184, 0.7)", // darker slate
    background: "rgba(30, 41, 59, 0.9)", // darker slate
  },
};

const CHART_HEIGHT = 350;

const MetricCard = ({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  className?: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={cn("p-2 rounded-full", className)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const DebtorsList = ({ deudores }: { deudores: IPersona[] }) => {
  if (!deudores.length) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        No hay deudores registrados
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[350px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Cliente</TableHead>
            <TableHead className="text-right">Límite de Crédito</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deudores.map((deudor) => (
            <TableRow key={deudor.id}>
              <TableCell className="text-left">
                {deudor.empresa || `${deudor.nombre} ${deudor.apellido}`}
              </TableCell>
              <TableCell className="text-right">
                {currencyFormat({ value: deudor.creditoLimite })}
              </TableCell>
              <TableCell className="text-right text-red-500">
                {currencyFormat({ value: deudor.balance })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Definir tipo para los datos de ventas diarias
interface DailySale {
  date: string | Date;
  total: number;
}

const DashboardPage: React.FC = () => {
  const {
    isLoading,
    isLoadingCharts,
    ventasMensuales,
    totalVentasMes,
    charts,
    deudores,
    fetchDashboardData,
    fetchChartsData, // Descomentar para asegurar actualización de charts
    fetchDeudores,
    // Líneas comentadas: estas funciones se extraían del store pero no se usan en el componente.
  } = useDashboardStore();

  const almacenes = useAlmacenesStore((state) => state.almacenes);
  const listarAlmacenes = useAlmacenesStore((state) => state.listarAlmacenes);
  const productos = useProductosStore((state) => state.productos);
  const totalProductos = useProductosStore((state) => state.total);
  const [valorCosto, setValorCosto] = React.useState<number | null>(null);
  const [valorVenta, setValorVenta] = React.useState<number | null>(null);
  const [calculandoCosto] = React.useState(false);
  const [calculandoVenta] = React.useState(false);

  // Definir colors según el tema actual
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme === "dark" ? "dark" : "light"];

  // Restaurar valores desde sessionStorage al montar
  React.useEffect(() => {
    const costoGuardado = sessionStorage.getItem("valorInventarioCosto");
    const ventaGuardada = sessionStorage.getItem("valorInventarioVenta");
    if (costoGuardado !== null) setValorCosto(Number(costoGuardado));
    if (ventaGuardada !== null) setValorVenta(Number(ventaGuardada));
  }, []);

  React.useEffect(() => {
    if (almacenes.length === 0) {
      listarAlmacenes();
    }
  }, [almacenes, listarAlmacenes]);

  // Quitar cálculo automático de inventario
  // Dejar solo la carga de almacenes si es necesario
  React.useEffect(() => {
    if (almacenes.length === 0) {
      listarAlmacenes();
    }
  }, [almacenes, listarAlmacenes]);

  // Recargar datos del dashboard, charts y deudores al montar el componente
  React.useEffect(() => {
    if (typeof fetchDashboardData === "function") {
      fetchDashboardData();
    }
    if (typeof fetchChartsData === "function") {
      fetchChartsData();
    }
    if (typeof fetchDeudores === "function") {
      fetchDeudores();
    }
  }, [fetchDashboardData, fetchChartsData, fetchDeudores]);

  // Funciones para calcular cada valoración bajo pedido
  const calcularValorCosto = async () => {
    // TO DO: Implementar lógica para calcular el valor de inventario por costo en el Backend
    console.log("Calculando valor de inventario por costo...");
  };

  const calcularValorVenta = async () => {
    // TO DO: Implementar lógica para calcular el valor de inventario por venta en el Backend
    console.log("Calculando valor de inventario por venta...");
  };

  // =============================
  // Modificación: Cálculo del total general de deuda
  // Se suma el balance de todos los clientes en el array deudores,
  // que es la misma información mostrada en la Lista de Deudores.
  // =============================
  const totalGeneralDeuda = deudores.reduce(
    (acc, d) => acc + (d.balance || 0),
    0
  );
  const totalReposicionMes = charts.reposicionesMes?.reduce(
    (acc: number, r: { monto: number }) => acc + (r.monto || 0),
    0
  );

  // =============================
  // Cálculo del total de ventas del día actual (más robusto)
  // =============================
  const today = new Date();
  const todayString = today.toISOString().split("T")[0]; // yyyy-mm-dd
  let totalVentasDia = 0;
  if (charts && charts.dailySales && Array.isArray(charts.dailySales)) {
    // Sumar todas las ventas del día actual (no solo la primera coincidencia)
    totalVentasDia = (charts.dailySales as DailySale[])
      .filter((d) => {
        const dDate =
          typeof d.date === "string" ? d.date.split("T")[0] : d.date;
        return dDate === todayString;
      })
      .reduce((acc, d) => acc + (d.total || 0), 0);
  }

  // LOG para depuración: Verificar productos y estructura
  console.log("productos:", productos);
  if (productos.length > 0) {
    console.log("Claves del primer producto:", Object.keys(productos[0]));
    console.log("Primer producto completo:", productos[0]);
    console.log(
      "Resumen productos:",
      productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        costo: p.costo,
        precioInstalador: p.precioInstalador,
        stock: p.stock,
      }))
    );
  }

  // LOG para depuración: Verificar stock de cada producto y su cálculo
  productos.forEach((p) => {
    if (p.stock && Array.isArray(p.stock)) {
      const totalStock = p.stock.reduce((sum, s) => {
        const actual = s.actual ?? 0;
        const transito = s.transito ?? 0;
        const reservado = s.reservado ?? 0;
        return sum + (actual + transito - reservado);
      }, 0);
      console.log(
        "Producto:",
        p.nombre,
        "Stock array:",
        p.stock,
        "TotalStock calculado:",
        totalStock,
        "Costo:",
        p.costo,
        "PrecioInstalador:",
        p.precioInstalador
      );
    } else {
      console.log(
        "Producto:",
        p.nombre,
        "NO tiene stock definido o no es un array:",
        p.stock
      );
    }
  });

  // LOG para depuración: Verificar ventas diarias
  console.log("charts.dailySales", charts.dailySales);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Ventas del Mes"
          value={ventasMensuales}
          icon={CalendarDays}
          className="bg-emerald-500/70 dark:bg-emerald-400/70"
        />
        <MetricCard
          title="Total Ventas Mes"
          value={currencyFormat({
            value: totalVentasMes,
          })}
          icon={BanknoteIcon}
          className="bg-blue-500/70 dark:bg-blue-400/70"
        />
        {/* <MetricCard
          title="Promedio por Venta"
          value={currencyFormat({ value: promedioVenta })}
          icon={BarChart2}
          className="bg-amber-500/70 dark:bg-amber-400/70"
        /> */}
        {/* Nuevo MetricCard: Total Ventas del Día */}
        <MetricCard
          title="Total Ventas del Día"
          value={currencyFormat({ value: totalVentasDia })}
          icon={BarChart2}
          className="bg-amber-500/70 dark:bg-amber-400/70"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total General de Deuda de Clientes"
          value={currencyFormat({ value: totalGeneralDeuda })}
          icon={AlertCircle}
          className="bg-rose-500/70 dark:bg-rose-400/70"
        />
        <MetricCard
          title="Total Reposicion Mes"
          value={currencyFormat({ value: totalReposicionMes })}
          icon={BarChart2}
          className="bg-indigo-500/70 dark:bg-indigo-400/70"
        />
        <MetricCard
          title="Cantidad de Productos Registrados"
          value={totalProductos}
          icon={Package}
          className="bg-indigo-500/70 dark:bg-indigo-400/70"
        />
      </div>

      {/* Nueva fila: Valoración de Inventario bajo demanda */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Valoracion Inventario COSTO
                </p>
                <p className="text-2xl font-bold">
                  {calculandoCosto ? (
                    <span className="flex items-center text-lg">
                      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2" />
                      <span className="text-base">Calculando...</span>
                    </span>
                  ) : valorCosto !== null ? (
                    currencyFormat({ value: valorCosto })
                  ) : (
                    "--"
                  )}
                </p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-full bg-green-500/70 dark:bg-green-400/70"
                )}
              >
                {" "}
                <BanknoteIcon className="h-5 w-5 text-white" />{" "}
              </div>
            </div>
            {/* Botón calcular: deshabilitado si ya hay valor calculado o si el otro cálculo está en proceso */}
            <button
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              onClick={calcularValorCosto}
              disabled={
                calculandoCosto || calculandoVenta || valorCosto !== null
              }
            >
              Calcular
            </button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Valoracion Inventario VENTA
                </p>
                <p className="text-2xl font-bold">
                  {calculandoVenta ? (
                    <span className="flex items-center text-lg">
                      <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2" />
                      <span className="text-base">Calculando...</span>
                    </span>
                  ) : valorVenta !== null ? (
                    currencyFormat({ value: valorVenta })
                  ) : (
                    "--"
                  )}
                </p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-full bg-yellow-500/70 dark:bg-yellow-400/70"
                )}
              >
                {" "}
                <BarChart2 className="h-5 w-5 text-white" />{" "}
              </div>
            </div>
            {/* Botón calcular: deshabilitado si ya hay valor calculado o si el otro cálculo está en proceso */}
            <button
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded disabled:opacity-50"
              onClick={calcularValorVenta}
              disabled={
                calculandoVenta || calculandoCosto || valorVenta !== null
              }
            >
              Calcular
            </button>
          </CardContent>
        </Card>
        <div />
      </div>

      {/* Modificación aquí: grilla de 2 columnas para los cuadros de información */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Ventas Diarias</CardTitle>
            <p className="text-sm text-muted-foreground">
              Evolución de ventas durante el mes actual
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <div className="flex justify-center items-center h-[350px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <LineChart
                data={charts.dailySales}
                categories={["total"]}
                index="date"
                colors={[colors.primary]}
                valueFormatter={(value: number) => currencyFormat({ value })}
                className={`h-[${CHART_HEIGHT}px]`}
                showLegend={false}
                showGridLines={false}
                showAnimation={true}
                curveType="monotone"
                customTooltip={(props) => (
                  <div className="rounded-lg border bg-card p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Fecha:</div>
                      <div>
                        {new Date(props.payload.date).toLocaleDateString()}
                      </div>
                      <div className="font-medium">Total:</div>
                      <div>
                        {currencyFormat({ value: props.payload.total })}
                      </div>
                    </div>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Ventas por Categoría</CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribución de ventas por categoría de producto
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingCharts ? (
              <div className="flex justify-center items-center h-[350px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
              </div>
            ) : (
              <BarChart
                data={charts.salesByCategory}
                categories={["total"]}
                index="category"
                colors={[colors.accent]}
                valueFormatter={(value: number) => currencyFormat({ value })}
                className={`h-[${CHART_HEIGHT}px]`}
                showLegend={false}
                showGridLines={false}
                showAnimation={true}
                customTooltip={(props) => (
                  <div className="rounded-lg border bg-card p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Categoría:</div>
                      <div>{props.payload.category}</div>
                      <div className="font-medium">Total:</div>
                      <div>
                        {currencyFormat({ value: props.payload.total })}
                      </div>
                      <div className="font-medium">Cantidad:</div>
                      <div>{props.payload.quantity} unidades</div>
                    </div>
                  </div>
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Ventas por Sucursal</CardTitle>
              <p className="text-sm text-muted-foreground">
                Distribución de ventas por sucursal durante el mes actual
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingCharts ? (
                <div className="flex justify-center items-center h-[350px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : (
                <PieChart
                  data={charts.salesByBranch}
                  categories={["total"]}
                  index="branch"
                  colors={[
                    colors.primary,
                    colors.secondary,
                    colors.accent,
                    colors.success,
                    colors.warning,
                    colors.error,
                  ]}
                  valueFormatter={(value: number) => currencyFormat({ value })}
                  className={`h-[${CHART_HEIGHT}px]`}
                />
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                Lista de Deudores
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Clientes con saldos pendientes de pago
              </p>
            </CardHeader>
            <CardContent>
              <DebtorsList deudores={deudores} />
            </CardContent>
          </Card>
        </div>
      }
    </div>
  );
};

export default DashboardPage;

// =============================
// Cambios realizados en este archivo:
// - Se comenta todo lo referente a 'promedioVenta' (ya no se usa en el dashboard).
// - Se agrega el cálculo de 'totalVentasDia' a partir de charts.dailySales, mostrando el total de ventas del día actual.
// - Se reemplaza el MetricCard de 'Promedio por Venta' por uno nuevo llamado 'Total Ventas del Día'.
// - Se tipifica correctamente el objeto de ventas diarias para evitar el uso de 'any'.
// =============================
