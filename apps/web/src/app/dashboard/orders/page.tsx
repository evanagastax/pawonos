"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ShoppingCart, Trash2, X, Clock, CheckCircle, Truck } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      toast("Order created", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.put(`/orders/${id}/status`, { status }); fetchOrders(); toast(`Order ${status}`, "success"); }
    catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete order?")) return;
    try { await api.delete(`/orders/${id}`); fetchOrders(); toast("Order deleted", "success"); }
    catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const todayOrders = orders.filter(o => new Date(o.deliveryDate).toDateString() === new Date().toDateString());
  const pending = orders.filter(o => ["DRAFT", "CONFIRMED"].includes(o.status));
  const inProduction = orders.filter(o => ["PREPARING", "COOKING", "PACKAGING"].includes(o.status));
  const delivered = orders.filter(o => ["DELIVERED", "COMPLETED"].includes(o.status));

  const columns = [
    { key: "orderNumber", label: "Order #", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "customer", label: "Customer", render: (v: any) => v?.name },
    { key: "mealTemplate", label: "Template", render: (v: any) => v?.name },
    { key: "quantity", label: "Qty", align: "right" as const },
    { key: "sellingPrice", label: "Price", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    { key: "deliveryDate", label: "Delivery", render: (v: string) => new Date(v).toLocaleDateString() },
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
          {row.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "CONFIRMED")}>Confirm</Button>}
          {row.status === "CONFIRMED" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "PREPARING")}>Prepare</Button>}
          {row.status === "READY" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "DELIVERING")}>Deliver</Button>}
          {row.status === "DELIVERING" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "COMPLETED")}>Complete</Button>}
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Manage catering orders"
        action={{ label: "New Order", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchOrders}
      />

      {showForm && (
        <FormCard title="New Order" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Customer" required>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} required>
                  <option value="">Select customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
                </select>
              </FormField>
              <FormField label="Meal Template" required>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.mealTemplateId} onChange={(e) => setFormData({ ...formData, mealTemplateId: e.target.value })} required>
                  <option value="">Select template</option>
                  {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </FormField>
              <FormField label="Quantity" required>
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })} required />
              </FormField>
              <FormField label="Delivery Date" required>
                <Input type="date" value={formData.deliveryDate} onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })} required />
              </FormField>
              <FormField label="Selling Price/Meal" required>
                <Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} required />
              </FormField>
              <FormField label="Delivery Time">
                <Input value={formData.deliveryTime} onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })} placeholder="11:00" />
              </FormField>
              <FormField label="Delivery Address" className="md:col-span-2">
                <Input value={formData.deliveryAddress} onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Create Order</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{todayOrders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pending.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{inProduction.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{delivered.length}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={orders}
          emptyMessage="No orders found. Click 'New Order' to create your first order."
        />
      )}
    </div>
  );
}