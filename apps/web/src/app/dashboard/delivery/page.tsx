"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, Clock, CheckCircle, MapPin } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";

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
    try { await api.put(`/orders/${id}/status`, { status }); fetchOrders(); toast(`Order ${status}`, "success"); }
    catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const ready = orders.filter(o => o.status === "READY");
  const inTransit = orders.filter(o => o.status === "DELIVERING");
  const delivered = orders.filter(o => o.status === "DELIVERED");

  const columns = [
    { key: "orderNumber", label: "Order #", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "customer", label: "Customer", render: (v: any) => v?.name },
    { key: "deliveryAddress", label: "Address", render: (v: string) => v || "-" },
    { key: "deliveryDate", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "status", label: "Status", align: "center" as const, render: (v: string) => <span className="px-2 py-1 rounded-full text-xs font-medium">{v}</span> },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-1 justify-center">
          {row.status === "READY" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "DELIVERING")}>Start</Button>}
          {row.status === "DELIVERING" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "DELIVERED")}>Delivered</Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery" description="Track deliveries" onRefresh={fetchOrders} />

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{ready.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{inTransit.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{delivered.length}</div></CardContent>
        </Card>
      </StatsGrid>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={orders}
          emptyMessage="No deliveries scheduled today."
        />
      )}
    </div>
  );
}