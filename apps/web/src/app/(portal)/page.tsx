"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Clock, CheckCircle, Truck, Package } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Order {
  id: string;
  orderNumber: string;
  quantity: number;
  sellingPrice: number;
  status: string;
  deliveryDate: string;
  mealTemplate: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  COOKING: "bg-orange-100 text-orange-800",
  PACKAGING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  DELIVERING: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-green-200 text-green-900",
};

export default function CustomerPortalPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // In real app, get from auth context
    const stored = localStorage.getItem("customerId");
    if (stored) {
      setCustomerId(stored);
      fetchOrders(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (cid: string) => {
    try {
      const res = await api.get("/orders", { params: { customerId: cid } });
      setOrders(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const activeOrders = orders.filter(o => !["COMPLETED", "CANCELLED"].includes(o.status));
  const completedOrders = orders.filter(o => o.status === "COMPLETED");

  if (!customerId) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">PawonOS</CardTitle>
            <p className="text-muted-foreground">Customer Portal</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Enter your customer ID to view orders.</p>
            <input
              type="text"
              placeholder="Customer ID"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4"
              onChange={(e) => {
                localStorage.setItem("customerId", e.target.value);
                setCustomerId(e.target.value);
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
          <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem("customerId"); setCustomerId(null); }}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">My Orders</h2>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{activeOrders.length}</div></CardContent>
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
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {orders.reduce((sum, o) => sum + o.sellingPrice * o.quantity, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <p className="text-center py-8">Loading...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.mealTemplate?.name} - {order.quantity} meals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Rp {(order.sellingPrice * order.quantity).toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </span>
                    <span>{order.quantity} meals @ Rp {order.sellingPrice.toLocaleString()}/meal</span>
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