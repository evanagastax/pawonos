"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [formData, setFormData] = useState({ orderId: "", dueDate: "", notes: "" });
  const [paymentData, setPaymentData] = useState({ amount: 0, paymentMethod: "bank_transfer", reference: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, sumRes, ordRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/invoices/summary"),
        api.get("/orders", { params: { status: "DELIVERED" } }),
      ]);
      setInvoices(invRes.data.items || []);
      setSummary(sumRes.data);
      setOrders(ordRes.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/invoices", formData);
      setShowForm(false);
      setFormData({ orderId: "", dueDate: "", notes: "" });
      fetchData();
      toast("Invoice created", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/invoices/${id}/status`, { status });
      fetchData();
      toast(`Invoice marked as ${status}`, "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handlePayment = async (invoiceId: string) => {
    try {
      await api.post(`/invoices/${invoiceId}/payment`, paymentData);
      setShowPayment(null);
      setPaymentData({ amount: 0, paymentMethod: "bank_transfer", reference: "" });
      fetchData();
      toast("Payment recorded", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const columns = [
    { key: "invoiceNumber", label: "Invoice #", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "order", label: "Order", render: (v: any) => v?.orderNumber },
    { key: "customer", label: "Customer", render: (_: any, row: any) => row.order?.customer?.name },
    { key: "amount", label: "Amount", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    { key: "dueDate", label: "Due Date", render: (v: string) => new Date(v).toLocaleDateString() },
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
          {row.status === "PENDING" && (
            <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "SENT")}>Send</Button>
          )}
          {["SENT", "OVERDUE"].includes(row.status) && (
            <Button size="sm" variant="outline" onClick={() => setShowPayment(row.id)}>
              <DollarSign className="h-3 w-3 mr-1" /> Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage invoices & payments"
        action={{ label: "Create Invoice", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchData}
      />

      {showForm && (
        <FormCard title="New Invoice" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Order" required>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.orderId} onChange={(e) => setFormData({ ...formData, orderId: e.target.value })} required>
                  <option value="">Select order</option>
                  {orders.map((o: any) => <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name}</option>)}
                </select>
              </FormField>
              <FormField label="Due Date" required>
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
              </FormField>
              <FormField label="Notes" className="md:col-span-2">
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Create Invoice</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pending?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Rp {(summary?.pending?.amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.sent?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Rp {(summary?.sent?.amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.paid?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Rp {(summary?.paid?.amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary?.overdue?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Need follow up</p>
          </CardContent>
        </Card>
      </StatsGrid>

      {showPayment && (
        <FormCard title="Record Payment" onClose={() => setShowPayment(null)}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Amount" required>
              <Input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })} required />
            </FormField>
            <FormField label="Method" required>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={paymentData.paymentMethod} onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="e_wallet">E-Wallet</option>
              </select>
            </FormField>
            <FormField label="Reference">
              <Input value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} placeholder="Transaction ID" />
            </FormField>
            <div className="flex items-end gap-2">
              <Button onClick={() => handlePayment(showPayment)}>Record Payment</Button>
              <Button variant="ghost" onClick={() => setShowPayment(null)}>Cancel</Button>
            </div>
          </div>
        </FormCard>
      )}

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={invoices}
          emptyMessage="No invoices found."
        />
      )}
    </div>
  );
}