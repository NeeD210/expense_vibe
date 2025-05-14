import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartBarStackedProps {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  title: string;
  description: string;
}

export function ChartBarStacked({ data, config, title, description }: ChartBarStackedProps) {
  // Get the last category key to add the label to
  const categoryKeys = Object.keys(config);
  const lastCategoryKey = categoryKeys[categoryKeys.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="aspect-square">
        <ChartContainer config={config}>
          <BarChart 
            accessibilityLayer 
            data={data}
            margin={{ top: 30, right: 10, left: 10, bottom: -30 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            {Object.keys(config).map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={`var(--color-${key})`}
                radius={index === categoryKeys.length - 1 ? [4, 4, 4, 4] : [0, 0, 4, 4]}
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
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
