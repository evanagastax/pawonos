"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Plus, Clock, CheckCircle, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ period: "", startDate: "", endDate: "" });

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

  const columns = [
    { key: "period", label: "Period", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "items", label: "Employees", align: "right" as const, render: (v: any) => v?.length || 0 },
    { key: "totalAmount", label: "Total", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
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
          {row.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "approve")}>Approve</Button>}
          {row.status === "APPROVED" && <Button size="sm" variant="outline" onClick={() => handleStatus(row.id, "pay")}>Mark Paid</Button>}
          {["DRAFT", "APPROVED"].includes(row.status) && <Button size="sm" variant="ghost" onClick={() => handleStatus(row.id, "cancel")}>Cancel</Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Generate & manage payroll"
        action={{ label: "Generate Payroll", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchPayrolls}
      />

      {showForm && (
        <FormCard title="Generate Payroll" onClose={() => setShowForm(false)}>
          <form onSubmit={handleGenerate} className="space-y-4">
            <FormGrid columns={3}>
              <FormField label="Period" required>
                <Input value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} placeholder="2026-07" required />
              </FormField>
              <FormField label="Start Date" required>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
              </FormField>
              <FormField label="End Date" required>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Generate</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={payrolls}
          emptyMessage="No payrolls found."
        />
      )}
    </div>
  );
}