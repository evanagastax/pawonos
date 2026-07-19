"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function DeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders((res.data.items || []).filter((o: any) => ["READY", "DELIVERING", "DELIVERED"].includes(o.status)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.put(`/orders/${id}/status`, { status }); fetchOrders(); }
    catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const ready = orders.filter(o => o.status === "READY");
  const inTransit = orders.filter(o => o.status === "DELIVERING");
  const delivered = orders.filter(o => o.status === "DELIVERED");

  return (
    <div className="space-y-6">
      <div><h2 className="text-3xl font-bold tracking-tight">Delivery</h2><p className="text-muted-foreground">Track deliveries</p></div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ready</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{ready.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Transit</CardTitle><MapPin className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{inTransit.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Delivered</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{delivered.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={fetchOrders} className="mb-4">Refresh</Button>
          {loading ? <p className="text-center py-8">Loading...</p> : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><Truck className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No deliveries scheduled.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50"><th className="p-4 text-left font-medium">Order #</th><th className="p-4 text-left font-medium">Customer</th><th className="p-4 text-left font-medium">Address</th><th className="p-4 text-left font-medium">Date</th><th className="p-4 text-center font-medium">Status</th><th className="p-4 text-center font-medium">Action</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-4 font-medium">{o.orderNumber}</td>
                      <td className="p-4">{o.customer?.name}</td>
                      <td className="p-4">{o.deliveryAddress || "-"}</td>
                      <td className="p-4">{new Date(o.deliveryDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center"><span className="px-2 py-1 rounded-full text-xs font-medium">{o.status}</span></td>
                      <td className="p-4 text-center">
                        {o.status === "READY" && <Button size="sm" variant="outline" onClick={() => handleStatus(o.id, "DELIVERING")}>Start Delivery</Button>}
                        {o.status === "DELIVERING" && <Button size="sm" variant="outline" onClick={() => handleStatus(o.id, "DELIVERED")}>Mark Delivered</Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}