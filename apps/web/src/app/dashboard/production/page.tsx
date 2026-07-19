"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Factory, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import api from "@/lib/api";`nimport { toast } from "@/hooks/use-toast";

interface Batch {
  id: string;
  batchNumber: string;
  status: string;
  scheduledDate: string;
  order: { orderNumber: string; customer: { name: string }; quantity: number; mealTemplate: { name: string } };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
  customer: { name: string };
  mealTemplate: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  PREPARING: "bg-yellow-100 text-yellow-800",
  COOKING: "bg-orange-100 text-orange-800",
  PACKAGING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  COMPLETED: "bg-green-200 text-green-900",
};

export default function ProductionPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
      setOrders((res.data.items || []).filter((o: Order) => o.status === "CONFIRMED"));
    } catch (err) { console.error(err); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.put(`/production/${id}/status`, { status }); fetchBatches(); fetchSummary(); }
    catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleGenerate = async (orderId: string) => {
    try {
      await api.post(`/production/generate/${orderId}`);
      setShowGenerate(false);
      fetchBatches();
      fetchSummary();
      fetchOrders();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Production</h2><p className="text-muted-foreground">Kitchen production batches</p></div>
        <Button onClick={() => setShowGenerate(!showGenerate)}>
          <Plus className="mr-2 h-4 w-4" /> Generate Batch
        </Button>
      </div>

      {showGenerate && orders.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Generate from Confirmed Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Order #</th>
                  <th className="p-3 text-left font-medium">Customer</th>
                  <th className="p-3 text-left font-medium">Template</th>
                  <th className="p-3 text-right font-medium">Qty</th>
                  <th className="p-3 text-center font-medium">Action</th>
                </tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="p-3 font-medium">{order.orderNumber}</td>
                      <td className="p-3">{order.customer?.name}</td>
                      <td className="p-3">{order.mealTemplate?.name}</td>
                      <td className="p-3 text-right">{order.quantity}</td>
                      <td className="p-3 text-center">
                        <Button size="sm" onClick={() => handleGenerate(order.id)}>Generate</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {showGenerate && orders.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No confirmed orders available for production.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today&apos;s Batches</CardTitle><Factory className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary?.totalBatches || 0}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary?.pending || 0}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Progress</CardTitle><AlertCircle className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{(summary?.preparing || 0) + (summary?.cooking || 0) + (summary?.packaging || 0)}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary?.completed || 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => { fetchBatches(); fetchSummary(); }}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><Factory className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No production batches. Click &quot;Generate Batch&quot; to create from confirmed orders.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Batch #</th>
                  <th className="p-4 text-left font-medium">Order</th>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-left font-medium">Template</th>
                  <th className="p-4 text-right font-medium">Qty</th>
                  <th className="p-4 text-left font-medium">Date</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {batches.map((b) => (
                    <tr key={b.id} className="border-b">
                      <td className="p-4 font-medium">{b.batchNumber}</td>
                      <td className="p-4">{b.order?.orderNumber}</td>
                      <td className="p-4">{b.order?.customer?.name}</td>
                      <td className="p-4">{b.order?.mealTemplate?.name}</td>
                      <td className="p-4 text-right">{b.order?.quantity}</td>
                      <td className="p-4">{new Date(b.scheduledDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || ''}`}>{b.status}</span></td>
                      <td className="p-4 text-center">
                        <div className="flex gap-1 justify-center">
                          {b.status === "PENDING" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "PREPARING")}>Start</Button>}
                          {b.status === "PREPARING" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "COOKING")}>Cook</Button>}
                          {b.status === "COOKING" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "PACKAGING")}>Pack</Button>}
                          {b.status === "PACKAGING" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "READY")}>Ready</Button>}
                          {b.status === "READY" && <Button size="sm" variant="outline" onClick={() => handleStatus(b.id, "COMPLETED")}>Complete</Button>}
                        </div>
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