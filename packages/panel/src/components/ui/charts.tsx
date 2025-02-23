import {
  Line,
  Bar,
  Pie,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface ChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  className?: string;
  showLegend?: boolean;
  showGridLines?: boolean;
  showAnimation?: boolean;
  curveType?: string;
  customTooltip?: (props: any) => JSX.Element;
}

export function LineChart({
  data,
  categories,
  index,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip
            formatter={valueFormatter}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          {categories.map((category, i) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              activeDot={{ r: 8 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart({
  data,
  categories,
  index,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={index} />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip
            formatter={valueFormatter}
            labelFormatter={(label) => `Categoría: ${label}`}
          />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PieChart({
  data,
  categories,
  index,
  colors = ["#2563eb"],
  valueFormatter = (value: number) => value.toString(),
  className,
}: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Tooltip
            formatter={valueFormatter}
            labelFormatter={(label) => `${label}`}
          />
          <Pie
            data={data}
            dataKey={categories[0]}
            nameKey={index}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            label={(entry) => entry.name}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
