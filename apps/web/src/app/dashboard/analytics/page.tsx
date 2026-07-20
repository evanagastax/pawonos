"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart } from "lucide-react";
import api from "@/lib/api";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [ingredientUsage, setIngredientUsage] = useState<any[]>([]);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, itemsRes, usageRes, trendRes] = await Promise.all([
        api.get("/analytics/dashboard", { params: { period } }),
        api.get("/analytics/top-menu-items"),
        api.get("/analytics/ingredient-usage"),
        api.get("/analytics/profit-trend"),
      ]);
      setData(dashRes.data);
      setTopItems(itemsRes.data || []);
      setIngredientUsage(usageRes.data || []);
      setProfitTrend(trendRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;

  const trendColumns = [
    { key: "month", label: "Month", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "revenue", label: "Revenue", align: "right" as const, render: (v: number) => <span className="text-green-600">Rp {v?.toLocaleString()}</span> },
    { key: "expenses", label: "Expenses", align: "right" as const, render: (v: number) => <span className="text-destructive">Rp {v?.toLocaleString()}</span> },
    { key: "profit", label: "Profit", align: "right" as const, render: (v: number) => <span className={v >= 0 ? "text-green-600" : "text-destructive"}>Rp {v?.toLocaleString()}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Analytics" description="Business insights & reports" />
        <div className="flex gap-2">
          {["week", "month", "year"].map((p) => (
            <Button key={p} variant={period === p ? "default" : "outline"} size="sm" onClick={() => setPeriod(p)}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.orders?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Rp {(data?.orders?.totalRevenue || 0).toLocaleString()} revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(data?.revenue?.total || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Delivered orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(data?.expenses?.total || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.production?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Batches</p>
          </CardContent>
        </Card>
      </StatsGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Selling Items</CardTitle></CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity} orders</p>
                      <p className="text-xs text-muted-foreground">Rp {(item.revenue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Ingredient Usage (30d)</CardTitle></CardHeader>
          <CardContent>
            {ingredientUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {ingredientUsage.slice(0, 10).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.quantity.toFixed(1)} units</p>
                      <p className="text-xs text-muted-foreground">Rp {item.cost.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Profit Trend (6 months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveTable
            columns={trendColumns}
            data={profitTrend}
            emptyMessage="No data"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order Status Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(data?.orders?.byStatus || {}).map(([status, count]) => (
              <div key={status} className="text-center p-3 border rounded-lg">
                <p className="text-2xl font-bold">{count as number}</p>
                <p className="text-xs text-muted-foreground">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}