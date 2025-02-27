import React, { useEffect } from "react";
import { useDashboardStore } from "../../store/dashboard.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, BanknoteIcon, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { currencyFormat, isSuperAdmin } from "shared/helpers";
import { LineChart, BarChart, PieChart } from "@/components/ui/charts";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth.store";

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

const DashboardPage: React.FC = () => {
  const {
    isLoading,
    isLoadingCharts,
    ventasMensuales,
    totalVentasMes,
    promedioVenta,
    charts,
    fetchDashboardData,
    fetchChartsData,
  } = useDashboardStore();

  const { theme } = useTheme();
  const colors = CHART_COLORS[theme === "dark" ? "dark" : "light"];
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  useEffect(() => {
    fetchDashboardData();
    fetchChartsData();
  }, [fetchDashboardData, fetchChartsData]);

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
      )}
    </div>
  );
};

export default DashboardPage;
