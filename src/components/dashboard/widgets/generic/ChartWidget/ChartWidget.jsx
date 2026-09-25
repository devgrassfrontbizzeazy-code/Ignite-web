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
  LabelList,
} from "recharts";

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
}) => {
  const chartData = Array.isArray(data) ? data : [];

  const formatValue = (value) => {
    if (typeof valueFormatter === "function") {
      return valueFormatter(value);
    }

    return value;
  };

  return (
    <section className="chart-widget">
      <div className="chart-widget__header">
        <div>
          <h3 className="chart-widget__title">{title}</h3>

          {description && (
            <p className="chart-widget__description">{description}</p>
          )}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="chart-widget__empty">{emptyMessage}</div>
      ) : (
        <div className="chart-widget__chart">
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    if (!value) return "";

                    const date = new Date(value);

                    return date.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatValue}
                />

                <Tooltip
                  formatter={(value) => formatValue(value)}
                />

                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: -20,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey={xKey}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                />

                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name,
                  ]}
                />

                {series.length > 0 ? (
                  series.map((item) => (
                    <Bar
                      key={item.dataKey}
                      dataKey={item.dataKey}
                      name={item.name}
                      stackId="employees"
                      fill={item.color}
                      maxBarSize={36}
                    />
                  ))
                ) : (
                  <Bar
                    dataKey={dataKey}
                    fill={color}
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  >
                    <LabelList
                      dataKey={dataKey}
                      position="top"
                      formatter={(value) =>
                        `${Number(value).toFixed(1)}h`
                      }
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        fill: "#1A1F24",
                      }}
                    />
                  </Bar>
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default ChartWidget;