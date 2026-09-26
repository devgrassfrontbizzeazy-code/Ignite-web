import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

import DashboardWidget from "../../../DashboardWidget/DashboardWidget";
import "./ChartWidget.css";

const ChartWidget = ({
  title,
  description,
  data,
  type = "bar",
  xKey,
  dataKey,
  series = [],
  color = "#0BA37F",
  valueFormatter,
  emptyMessage = "No data available.",
  action,
  onAction,
  loading = false,
  className = "",
}) => {
  const chartData = Array.isArray(data) ? data : [];

  const formatValue = (value) => {
    if (typeof valueFormatter === "function") {
      return valueFormatter(value);
    }

    return value;
  };

  return (
    <DashboardWidget
      title={title}
      action={action}
      onAction={onAction}
      loading={loading}
      className={`chart-widget ${className}`}
    >
      {description && (
        <p className="chart-widget__description">{description}</p>
      )}

      {chartData.length === 0 ? (
        <div className="chart-widget__empty">{emptyMessage}</div>
      ) : (
        <div className="chart-widget__chart">
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -16,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15, 61, 62, 0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5A6E75", fontFamily: "inherit" }}
                  dy={6}
                  tickFormatter={(value) => {
                    if (!value) return "";

                    const date = new Date(value);
                    if (isNaN(date.getTime())) return value;

                    return date.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5A6E75", fontFamily: "inherit" }}
                  dx={-4}
                  tickFormatter={formatValue}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F3D3E",
                    border: "none",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    boxShadow: "0 6px 20px rgba(15, 61, 62, 0.25)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#FFFFFF", fontSize: "12px" }}
                  labelStyle={{
                    color: "#D4AF37",
                    fontWeight: 600,
                    fontSize: "11px",
                    marginBottom: "2px",
                  }}
                  cursor={{ stroke: "rgba(11, 163, 127, 0.25)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  formatter={(value) => [formatValue(value), "Hours"]}
                />

                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: color, stroke: "#FFFFFF", strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: "#0F3D3E", stroke: color, strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 12,
                  left: -16,
                  bottom: series.length > 0 ? 0 : 4,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15, 61, 62, 0.08)"
                  vertical={false}
                />

                <XAxis
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5A6E75", fontFamily: "inherit" }}
                  dy={6}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#5A6E75", fontFamily: "inherit" }}
                  allowDecimals={false}
                  dx={-4}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F3D3E",
                    border: "none",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    boxShadow: "0 6px 20px rgba(15, 61, 62, 0.25)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#FFFFFF", fontSize: "12px", padding: "1px 0" }}
                  labelStyle={{
                    color: "#D4AF37",
                    fontWeight: 600,
                    fontSize: "11px",
                    marginBottom: "4px",
                  }}
                  cursor={{ fill: "rgba(15, 61, 62, 0.04)" }}
                  formatter={(value, name) => [value, name]}
                />

                {series.length > 0 && (
                  <Legend
                    wrapperStyle={{
                      paddingTop: 12,
                      fontSize: 11,
                      fontFamily: "inherit",
                      color: "#1A1F24",
                    }}
                    iconType="circle"
                    iconSize={8}
                  />
                )}

                {series.length > 0 ? (
                  series.map((item, idx) => (
                    <Bar
                      key={item.dataKey}
                      dataKey={item.dataKey}
                      name={item.name}
                      stackId="employees"
                      fill={item.color}
                      maxBarSize={32}
                      radius={idx === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))
                ) : (
                  <Bar
                    dataKey={dataKey}
                    fill={color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    <LabelList
                      dataKey={dataKey}
                      position="top"
                      formatter={formatValue}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        fill: "#1A1F24",
                        fontFamily: "inherit",
                      }}
                    />
                  </Bar>
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </DashboardWidget>
  );
};

export default ChartWidget;