"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, RadialBar, RadialBarChart } from "recharts"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export const description = "A radial chart showing cloud storage usage"

const chartData = [
  { service: "googledrive", storage: 45.2, fill: "var(--color-googledrive)" },
  { service: "onedrive", storage: 32.8, fill: "var(--color-onedrive)" },
  { service: "dropbox", storage: 18.5, fill: "var(--color-dropbox)" },
]

const chartConfig = {
  storage: {
    label: "Storage (GB)",
  },
  googledrive: {
    label: "Google Drive",
    color: "var(--color-sidebar-primary)",
  },
  onedrive: {
    label: "OneDrive",
    color: "var(--color-sidebar-primary)",
  },
  dropbox: {
    label: "Dropbox",
    color: "var(--color-sidebar-primary)",
  },
} satisfies ChartConfig

export default function StorageChart() {
  return (
    <Card className="flex flex-col bg-transparent border-none shadow-none">
      <CardHeader className="items-center pb-0">
        <CardTitle>Cloud Storage Usage</CardTitle>
        <CardDescription>Current storage across platforms</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <RadialBarChart data={chartData} startAngle={-90} endAngle={380} innerRadius={30} outerRadius={110}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent hideLabel nameKey="service" formatter={(value) => [`${value} GB`, "Storage"]} />
              }
            />
            <RadialBar dataKey="storage" background>
              <LabelList
                position="insideStart"
                dataKey="service"
                className="fill-white capitalize mix-blend-luminosity"
                fontSize={11}
              />
            </RadialBar>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total storage: 96.5 GB <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Google Drive leads with 45.2 GB of stored data</div>
      </CardFooter>
    </Card>
  )
}
