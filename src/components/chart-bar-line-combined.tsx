"use client"

import { Bar, BarChart, CartesianGrid, Line, ComposedChart, XAxis, YAxis, Tooltip, Legend, LabelList } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarLineCombinedProps {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  title: string;
  description: string;
}

export function ChartBarLineCombined({ data, config, title, description }: ChartBarLineCombinedProps) {
  // Get the category keys (excluding month, total, and income)
  const categoryKeys = Object.keys(config).filter(key => key !== 'income');
  const lastCategoryKey = categoryKeys[categoryKeys.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="w-full">
        <ChartContainer config={config}>
          <ComposedChart 
            accessibilityLayer 
            data={data}
            margin={{ top: 30, right: 20, left: 0, bottom: 5 }}
            maxBarSize={60}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis 
              yAxisId="left"
              hide={true}
            />
            <Tooltip 
              formatter={(value, name) => {
                return [`$${Number(value).toFixed(2)}`, name];
              }}
            />
            <Legend />
            
            {/* Stacked Bar for expenses */}
            {categoryKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={config[key]?.color || `var(--color-${key})`}
                yAxisId="left"
                radius={index === categoryKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              >
                {key === lastCategoryKey && (
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(value: number) => `$${value.toFixed(0)}`}
                    offset={10}
                    className="fill-foreground"
                    fontSize={12}
                  />
                )}
              </Bar>
            ))}
            
            {/* Line for income */}
            <Line
              dataKey="income"
              type="monotone"
              stroke={config.income?.color || "#10b981"}
              strokeWidth={3}
              yAxisId="left"
              dot={{ fill: config.income?.color || "#10b981", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8 }}
              name="Income"
            >
              <LabelList
                dataKey="income"
                position="top"
                formatter={(value: number) => value > 0 ? `$${value.toFixed(0)}` : ''}
                offset={12}
                className="fill-green-600"
                fontSize={12}
              />
            </Line>
          </ComposedChart>
        </ChartContainer>
      </div>
    </div>
  )
} 