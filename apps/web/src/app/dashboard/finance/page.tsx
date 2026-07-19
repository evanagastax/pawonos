"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function FinancePage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchKpis(); }, []);

  const fetchKpis = async () => {
    try { const res = await api.get("/cost-engine/dashboard"); setKpis(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Finance</h2><p className="text-muted-foreground">Cost analysis & profitability</p></div>
        <Button variant="outline" onClick={fetchKpis}>Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenue</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">Rp {(kpis?.revenue || 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Est. Profit</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Rp {(kpis?.estimatedProfit || 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inventory Value</CardTitle><TrendingDown className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Rp {(kpis?.inventoryValue || 0).toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock Items</CardTitle><Percent className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{kpis?.lowStockCount || 0}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Today&apos;s Summary</CardTitle></CardHeader><CardContent>
          {loading ? <p>Loading...</p> : (
            <div className="space-y-2">
              <div className="flex justify-between"><span>Total Orders</span><span className="font-bold">{kpis?.totalOrders || 0}</span></div>
              <div className="flex justify-between"><span>Total Meals</span><span className="font-bold">{kpis?.totalMeals || 0}</span></div>
              <div className="flex justify-between"><span>Revenue</span><span className="font-bold">Rp {(kpis?.revenue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Est. Profit (30%)</span><span className="font-bold">Rp {(kpis?.estimatedProfit || 0).toLocaleString()}</span></div>
            </div>
          )}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">
            <div className="flex justify-between"><span>Inventory Value</span><span className="font-bold">Rp {(kpis?.inventoryValue || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Low Stock Items</span><span className="font-bold text-destructive">{kpis?.lowStockCount || 0}</span></div>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}