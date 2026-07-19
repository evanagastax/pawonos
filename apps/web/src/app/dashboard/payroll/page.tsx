"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Plus, Clock, CheckCircle, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Payroll {
  id: string;
  period: string;
  status: string;
  totalAmount: number;
  items: Array<{ employee: { name: string }; netSalary: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    period: "", startDate: "", endDate: "",
  });

  useEffect(() => { fetchPayrolls(); }, []);

  const fetchPayrolls = async () => {
    try { const res = await api.get("/payroll"); setPayrolls(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/payroll/generate", formData);
      setShowForm(false);
      setFormData({ period: "", startDate: "", endDate: "" });
      fetchPayrolls();
      toast("Payroll generated", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleStatus = async (id: string, action: string) => {
    try {
      await api.put(`/payroll/${id}/${action}`);
      fetchPayrolls();
      toast(`Payroll ${action}d`, "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Payroll</h2><p className="text-muted-foreground">Generate & manage payroll</p></div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "Generate Payroll"}</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Generate Payroll</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleGenerate} className="grid gap-4 md:grid-cols-3">
            <div><label className="text-sm font-medium">Period *</label><Input value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} placeholder="2026-07" required /></div>
            <div><label className="text-sm font-medium">Start Date *</label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">End Date *</label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required /></div>
            <div className="md:col-span-3"><Button type="submit">Generate</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={fetchPayrolls} className="mb-4">Refresh</Button>
          {loading ? <p className="text-center py-8">Loading...</p> : payrolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><DollarSign className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No payrolls found.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Period</th>
                  <th className="p-4 text-right font-medium">Employees</th>
                  <th className="p-4 text-right font-medium">Total</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {payrolls.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-4 font-medium">{p.period}</td>
                      <td className="p-4 text-right">{p.items?.length || 0}</td>
                      <td className="p-4 text-right">Rp {p.totalAmount?.toLocaleString()}</td>
                      <td className="p-4 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || ""}`}>{p.status}</span></td>
                      <td className="p-4 text-center">
                        <div className="flex gap-1 justify-center">
                          {p.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => handleStatus(p.id, "approve")}>Approve</Button>}
                          {p.status === "APPROVED" && <Button size="sm" variant="outline" onClick={() => handleStatus(p.id, "pay")}>Mark Paid</Button>}
                          {["DRAFT", "APPROVED"].includes(p.status) && <Button size="sm" variant="ghost" onClick={() => handleStatus(p.id, "cancel")}>Cancel</Button>}
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