import React, { useEffect } from "react";
import { useDashboardStore } from "../../store/dashboard.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  BanknoteIcon,
  BarChart2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currencyFormat, isSuperAdmin } from "shared/helpers";
import { LineChart, BarChart, PieChart } from "@/components/ui/charts";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth.store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IPersona } from "shared/interfaces";

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

const DashboardPage: React.FC = () => {
  const {
    isLoading,
    isLoadingCharts,
    ventasMensuales,
    totalVentasMes,
    promedioVenta,
    charts,
    deudores,
    fetchDashboardData,
    fetchChartsData,
    fetchDeudores,
  } = useDashboardStore();

  const { theme } = useTheme();
  const colors = CHART_COLORS[theme === "dark" ? "dark" : "light"];
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  useEffect(() => {
    fetchDashboardData();
    fetchChartsData();
    fetchDeudores();
  }, [fetchDashboardData, fetchChartsData, fetchDeudores]);

  // =============================
  // Modificación: Cálculo del total general de deuda
  // Se suma el balance de todos los clientes en el array deudores,
  // que es la misma información mostrada en la Lista de Deudores.
  // =============================
  const totalGeneralDeuda = deudores.reduce(
    (acc, d) => acc + (d.balance || 0),
    0
  );

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
        <MetricCard
          title="Promedio por Venta"
          value={currencyFormat({
            value: promedioVenta,
          })}
          icon={BarChart2}
          className="bg-amber-500/70 dark:bg-amber-400/70"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* =============================
            Modificación: Nuevo MetricCard para mostrar el total general de deuda de los clientes
            usando la suma de los balances de los deudores
         ============================= */}
        <MetricCard
          title="Total General de Deuda de Clientes"
          value={currencyFormat({ value: totalGeneralDeuda })}
          icon={AlertCircle}
          className="bg-rose-500/70 dark:bg-rose-400/70"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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

      {isAdmin && (
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
      )}
    </div>
  );
};

export default DashboardPage;
