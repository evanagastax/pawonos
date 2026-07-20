"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Package, DollarSign, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">AI Forecast</h2><p className="text-muted-foreground">Demand prediction & optimization</p></div>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <Button key={d} variant={days === d ? "default" : "outline"} size="sm" onClick={() => setDays(d)}>{d}d</Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Demand Forecast */}
        <Card>
          <CardHeader><CardTitle>Demand Forecast</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Day</th>
                  <th className="p-3 text-right font-medium">Predicted</th>
                  <th className="p-3 text-right font-medium">Confidence</th>
                </tr></thead>
                <tbody>
                  {demand?.forecast?.map((f: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-3">{f.date}</td>
                      <td className="p-3">{f.dayOfWeek}</td>
                      <td className="p-3 text-right font-medium">{f.predictedOrders}</td>
                      <td className="p-3 text-right">{Math.round(f.confidence * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Ingredient Forecast */}
        <Card>
          <CardHeader><CardTitle>Ingredient Needs</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Ingredient</th>
                  <th className="p-3 text-right font-medium">Quantity</th>
                  <th className="p-3 text-right font-medium">Est. Cost</th>
                </tr></thead>
                <tbody>
                  {ingredients?.ingredients?.map((ing: any, i: number) => (
                    <tr key={i} className="border-b">
                      <td className="p-3">{ing.name}</td>
                      <td className="p-3 text-right">{ing.quantity} {ing.unit}</td>
                      <td className="p-3 text-right">Rp {ing.estimatedCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menu Optimization */}
      {optimization.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" />Menu Optimization Suggestions</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Menu Item</th>
                  <th className="p-3 text-right font-medium">Price</th>
                  <th className="p-3 text-right font-medium">HPP</th>
                  <th className="p-3 text-right font-medium">Margin</th>
                  <th className="p-3 text-left font-medium">Suggestion</th>
                </tr></thead>
                <tbody>
                  {optimization.map((opt, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-3 font-medium">{opt.menuItem}</td>
                      <td className="p-3 text-right">Rp {opt.currentPrice.toLocaleString()}</td>
                      <td className="p-3 text-right">Rp {opt.hpp.toLocaleString()}</td>
                      <td className={`p-3 text-right font-medium ${opt.margin < 0 ? "text-destructive" : "text-yellow-600"}`}>
                        {opt.margin}%
                      </td>
                      <td className="p-3 text-sm">{opt.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}