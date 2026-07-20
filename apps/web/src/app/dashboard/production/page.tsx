"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Factory, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  COOKING: "bg-orange-100 text-orange-800",
  PACKAGING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-200 text-green-900",
};

export default function ProductionPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [showGenerate, setShowGenerate] = useState(false);

  useEffect(() => { fetchBatches(); fetchSummary(); fetchOrders(); }, []);

  const fetchBatches = async () => {
    try { const res = await api.get("/production"); setBatches(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSummary = async () => {
    try { const res = await api.get("/production/daily-summary"); setSummary(res.data); }
    catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders((res.data.items || []).filter((o: any) => o.status === "CONFIRMED"));
    } catch (err) { console.error(err); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.put(`/production/${id}/status`, { status }); fetchBatches(); fetchSummary(); toast(`Status: ${status}`, "success"); }
    catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleGenerate = async (orderId: string) => {
    try {
      await api.post(`/production/generate/${orderId}`);
      setShowGenerate(false);
      fetchBatches();
      fetchSummary();
      fetchOrders();
      toast("Batch generated", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const columns = [
    { key: "batchNumber", label: "Batch #", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "order", label: "Order", render: (v: any) => v?.orderNumber },
    { key: "customer", label: "Customer", render: (_: any, row: any) => row.order?.customer?.name },
    { key: "template", label: "Template", render: (_: any, row: any) => row.order?.mealTemplate?.name },
    { key: "quantity", label: "Qty", align: "right" as const, render: (_: any, row: any) => row.order?.quantity },
    { key: "scheduledDate", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (v: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[v] || ""}`}>{v}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-1 justify-center">
          {row.status === "PENDING" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "PREPARING")}>Start</Button>}
          {row.status === "PREPARING" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "COOKING")}>Cook</Button>}
          {row.status === "COOKING" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "PACKAGING")}>Pack</Button>}
          {row.status === "PACKAGING" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "READY")}>Ready</Button>}
          {row.status === "READY" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "COMPLETED")}>Complete</Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production"
        description="Kitchen production batches"
        action={{ label: "Generate Batch", onClick: () => setShowGenerate(!showForm), icon: <Plus className="h-4 w-4 md:mr-2" /> }}
        showForm={showGenerate}
        onRefresh={() => { fetchBatches(); fetchSummary(); }}
      />

      {showGenerate && (
        <Card>
          <CardHeader><CardTitle>Generate from Confirmed Orders</CardTitle></CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No confirmed orders available.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.customer?.name} - {order.quantity} meals</p>
                    </div>
                    <Button size="sm" onClick={() => handleGenerate(order.id)}>Generate</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Batches</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.totalBatches || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.pending || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{(summary?.preparing || 0) + (summary?.cooking || 0) + (summary?.packaging || 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{summary?.completed || 0}</div></CardContent>
        </Card>
      </StatsGrid>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={batches}
          emptyMessage="No production batches. Click 'Generate Batch' to create from confirmed orders."
        />
      )}
    </div>
  );
}