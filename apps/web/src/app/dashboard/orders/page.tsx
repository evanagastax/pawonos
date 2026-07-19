"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ShoppingCart, Trash2, X, Clock, CheckCircle, Truck } from "lucide-react";
import api from "@/lib/api";`nimport { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  orderNumber: string;
  quantity: number;
  sellingPrice: number;
  status: string;
  deliveryDate: string;
  customer: { name: string; company: string | null };
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
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: "", mealTemplateId: "", quantity: 60, deliveryDate: "",
    deliveryTime: "", sellingPrice: 0, specialNotes: "", deliveryAddress: "",
  });

  useEffect(() => { fetchOrders(); fetchCustomers(); fetchTemplates(); }, []);

  const fetchOrders = async () => {
    try { const res = await api.get("/orders", { params: { search } }); setOrders(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try { const res = await api.get("/customers"); setCustomers(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const fetchTemplates = async () => {
    try { const res = await api.get("/meal-templates"); setTemplates(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/orders", formData);
      setShowForm(false);
      fetchOrders();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.put(`/orders/${id}/status`, { status }); fetchOrders(); }
    catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/orders/${id}`); fetchOrders(); }
    catch { toast("Failed", "error"); }
  };

  const todayOrders = orders.filter(o => new Date(o.deliveryDate).toDateString() === new Date().toDateString());
  const pending = orders.filter(o => ["DRAFT", "CONFIRMED"].includes(o.status));
  const inProduction = orders.filter(o => ["PREPARING", "COOKING", "PACKAGING"].includes(o.status));
  const delivered = orders.filter(o => ["DELIVERED", "COMPLETED"].includes(o.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">Manage catering orders</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "New Order"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Order</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Customer *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} required>
                  <option value="">Select customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Meal Template *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.mealTemplateId} onChange={(e) => setFormData({ ...formData, mealTemplateId: e.target.value })} required>
                  <option value="">Select template</option>
                  {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Quantity *</label>
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Delivery Date *</label>
                <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Selling Price/Meal *</label>
                <Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Delivery Time</label>
                <Input value={formData.deliveryTime} onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })} placeholder="11:00" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Delivery Address</label>
                <Input value={formData.deliveryAddress} onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create Order</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Today</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{todayOrders.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pending</CardTitle><Clock className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{pending.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">In Production</CardTitle><CheckCircle className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{inProduction.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Delivered</CardTitle><Truck className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{delivered.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Button variant="outline" onClick={fetchOrders}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No orders found.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Order #</th>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-left font-medium">Template</th>
                  <th className="p-4 text-right font-medium">Qty</th>
                  <th className="p-4 text-right font-medium">Price</th>
                  <th className="p-4 text-left font-medium">Delivery</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-4 font-medium">{o.orderNumber}</td>
                      <td className="p-4">{o.customer?.name}</td>
                      <td className="p-4">{o.mealTemplate?.name}</td>
                      <td className="p-4 text-right">{o.quantity}</td>
                      <td className="p-4 text-right">Rp {o.sellingPrice?.toLocaleString()}</td>
                      <td className="p-4">{new Date(o.deliveryDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || ''}`}>{o.status}</span></td>
                      <td className="p-4 text-center">
                        <div className="flex gap-1 justify-center">
                          {o.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => handleStatus(o.id, "CONFIRMED")}>Confirm</Button>}
                          {o.status === "CONFIRMED" && <Button size="sm" variant="outline" onClick={() => handleStatus(o.id, "PREPARING")}>Prepare</Button>}
                          {o.status === "READY" && <Button size="sm" variant="outline" onClick={() => handleStatus(o.id, "DELIVERING")}>Deliver</Button>}
                          {o.status === "DELIVERING" && <Button size="sm" variant="outline" onClick={() => handleStatus(o.id, "COMPLETED")}>Complete</Button>}
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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