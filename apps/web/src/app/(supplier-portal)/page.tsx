"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Package, Clock, CheckCircle } from "lucide-react";
import api from "@/lib/api";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  expectedDate: string | null;
  items: Array<{ ingredient?: { name: string }; packaging?: { name: string }; quantity: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  RECEIVED: "bg-green-100 text-green-900",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function SupplierPortalPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("supplierId");
    if (stored) {
      setSupplierId(stored);
      fetchOrders(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (sid: string) => {
    try {
      const res = await api.get("/purchasing", { params: { supplierId: sid } });
      setOrders(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const pendingOrders = orders.filter(o => ["SENT", "PARTIAL"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "RECEIVED");

  if (!supplierId) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">PawonOS</CardTitle>
            <p className="text-muted-foreground">Supplier Portal</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Enter your supplier ID to view purchase orders.</p>
            <input
              type="text"
              placeholder="Supplier ID"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4"
              onChange={(e) => {
                localStorage.setItem("supplierId", e.target.value);
                setSupplierId(e.target.value);
                fetchOrders(e.target.value);
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">PawonOS</h1>
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("supplierId"); setSupplierId(null); }}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Purchase Orders</h2>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{pendingOrders.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{completedOrders.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No purchase orders</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.orderDate).toLocaleDateString()}
                        {order.expectedDate && ` → Expected: ${new Date(order.expectedDate).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {order.totalAmount.toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {order.items?.map((item, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        • {item.ingredient?.name || item.packaging?.name} × {item.quantity}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}