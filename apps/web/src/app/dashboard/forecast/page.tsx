"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Package, AlertTriangle } from "lucide-react";
import api from "@/lib/api";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";

export default function ForecastPage() {
  const [demand, setDemand] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [optimization, setOptimization] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => { fetchData(); }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [demandRes, ingRes, revRes, optRes] = await Promise.all([
        api.get("/forecast/demand", { params: { days } }),
        api.get("/forecast/ingredients", { params: { days } }),
        api.get("/forecast/revenue", { params: { days: 30 } }),
        api.get("/forecast/menu-optimization"),
      ]);
      setDemand(demandRes.data);
      setIngredients(ingRes.data);
      setRevenue(revRes.data);
      setOptimization(optRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const demandColumns = [
    { key: "date", label: "Date" },
    { key: "dayOfWeek", label: "Day" },
    { key: "predictedOrders", label: "Predicted", align: "right" as const },
    { key: "confidence", label: "Confidence", align: "right" as const, render: (v: number) => `${Math.round(v * 100)}%` },
  ];

  const ingredientColumns = [
    { key: "name", label: "Ingredient" },
    { key: "quantity", label: "Quantity", align: "right" as const, render: (v: number, row: any) => `${v} ${row.unit}` },
    { key: "estimatedCost", label: "Est. Cost", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
  ];

  const optimizationColumns = [
    { key: "menuItem", label: "Menu Item", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "currentPrice", label: "Price", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    { key: "hpp", label: "HPP", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    { key: "margin", label: "Margin", align: "right" as const, render: (v: number) => <span className={v < 0 ? "text-destructive" : "text-yellow-600"}>{v}%</span> },
    { key: "suggestion", label: "Suggestion" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="AI Forecast" description="Demand prediction & optimization" />
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <Button key={d} variant={days === d ? "default" : "outline"} size="sm" onClick={() => setDays(d)}>{d}d</Button>
          ))}
        </div>
      </div>

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Orders</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demand?.forecast?.reduce((s: number, f: any) => s + f.predictedOrders, 0) || 0}</div>
            <p className="text-xs text-muted-foreground">Next {days} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingredient Cost</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(ingredients?.ingredients?.reduce((s: number, i: any) => s + i.estimatedCost, 0) || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecasted Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(revenue?.forecastedTotal || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Margin Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{optimization.length}</div>
            <p className="text-xs text-muted-foreground">Need optimization</p>
          </CardContent>
        </Card>
      </StatsGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Demand Forecast</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveTable columns={demandColumns} data={demand?.forecast || []} emptyMessage="No data" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ingredient Needs</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveTable columns={ingredientColumns} data={ingredients?.ingredients || []} emptyMessage="No data" />
          </CardContent>
        </Card>
      </div>

      {optimization.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Menu Optimization Suggestions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveTable columns={optimizationColumns} data={optimization} emptyMessage="All items optimized" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}