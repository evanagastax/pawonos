"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, DollarSign, Clock, AlertTriangle, CheckCircle, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  order: { orderNumber: string; customer: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed", "error");
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/invoices/${id}/status`, { status });
      fetchData();
      toast(`Invoice marked as ${status}`, "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed", "error");
    }
  };

  const handlePayment = async (invoiceId: string) => {
    try {
      await api.post(`/invoices/${invoiceId}/payment`, paymentData);
      setShowPayment(null);
      setPaymentData({ amount: 0, paymentMethod: "bank_transfer", reference: "" });
      fetchData();
      toast("Payment recorded", "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage invoices & payments</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "Create Invoice"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Invoice</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Order *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.orderId} onChange={(e) => setFormData({ ...formData, orderId: e.target.value })} required>
                  <option value="">Select order</option>
                  {orders.map((o: any) => <option key={o.id} value={o.id}>{o.orderNumber} - {o.customer?.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date *</label>
                <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create Invoice</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
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
      </div>

      {/* Invoice List */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={fetchData} className="mb-4">Refresh</Button>
          {loading ? (
            <p className="text-center py-8">Loading...</p>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No invoices found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Invoice #</th>
                  <th className="p-4 text-left font-medium">Order</th>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-right font-medium">Amount</th>
                  <th className="p-4 text-left font-medium">Due Date</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="p-4 font-medium">{inv.invoiceNumber}</td>
                      <td className="p-4">{inv.order?.orderNumber}</td>
                      <td className="p-4">{inv.order?.customer?.name}</td>
                      <td className="p-4 text-right">Rp {inv.amount?.toLocaleString()}</td>
                      <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || ""}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-1 justify-center">
                          {inv.status === "PENDING" && (
                            <Button size="sm" variant="outline" onClick={() => handleStatus(inv.id, "SENT")}>Send</Button>
                          )}
                          {["SENT", "OVERDUE"].includes(inv.status) && (
                            <Button size="sm" variant="outline" onClick={() => setShowPayment(inv.id)}>
                              <DollarSign className="h-3 w-3 mr-1" /> Pay
                            </Button>
                          )}
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

      {/* Payment Modal */}
      {showPayment && (
        <Card>
          <CardHeader><CardTitle>Record Payment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Method *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={paymentData.paymentMethod} onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="e_wallet">E-Wallet</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Reference</label>
                <Input value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} placeholder="Transaction ID" />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={() => handlePayment(showPayment)}>Record Payment</Button>
                <Button variant="ghost" onClick={() => setShowPayment(null)}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}