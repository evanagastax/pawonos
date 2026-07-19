"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ChefHat, 
  ShoppingCart, 
  Truck, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Package,
  DollarSign,
  Factory,
  Users,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [todayBatches, setTodayBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [kpisRes, stockRes, ordersRes, batchesRes] = await Promise.all([
        api.get("/cost-engine/dashboard"),
        api.get("/inventory/low-stock"),
        api.get("/orders", { params: { status: "CONFIRMED" } }),
        api.get("/production/daily-summary"),
      ]);
      setKpis(kpisRes.data);
      setLowStock(stockRes.data || []);
      setPendingOrders(ordersRes.data.items || []);
      setTodayBatches(batchesRes.data || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your daily overview.</p>
        </div>
        <Button variant="outline" onClick={fetchDashboard}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Four Key Questions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">What to Cook Today?</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBatches.totalBatches || 0} batches</div>
            <p className="text-xs text-muted-foreground">
              {todayBatches.totalMeals || 0} meals total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">What to Buy?</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock.length} items</div>
            <p className="text-xs text-muted-foreground">Low stock alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{kpis?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground">Items below minimum</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(kpis?.revenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{kpis?.totalOrders || 0} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(kpis?.estimatedProfit || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">~30% margin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(kpis?.inventoryValue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalMeals || 0}</div>
            <p className="text-xs text-muted-foreground">Today&apos;s production</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">All stock levels OK</p>
            ) : (
              <div className="space-y-2">
                {lowStock.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{item.ingredient?.name || item.packaging?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Min: {item.ingredient?.minimumStock || item.packaging?.minimumStock} {item.ingredient?.unit?.symbol || item.packaging?.unit?.symbol}
                      </p>
                    </div>
                    <span className="text-destructive font-bold">{item.currentStock}</span>
                  </div>
                ))}
                {lowStock.length > 5 && (
                  <p className="text-sm text-muted-foreground">+{lowStock.length - 5} more items</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending orders</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customer?.name} - {order.quantity} meals</p>
                    </div>
                    <span className="text-sm">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                  </div>
                ))}
                {pendingOrders.length > 5 && (
                  <p className="text-sm text-muted-foreground">+{pendingOrders.length - 5} more orders</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}