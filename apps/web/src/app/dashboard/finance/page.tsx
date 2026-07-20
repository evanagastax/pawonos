"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Receipt } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  category: { name: string };
}

export default function FinancePage() {
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfRes, plRes, expRes, catRes] = await Promise.all([
        api.get("/finance/cash-flow"),
        api.get("/finance/profit-loss"),
        api.get("/finance/expenses"),
        api.get("/finance/categories"),
      ]);
      setCashFlow(cfRes.data);
      setProfitLoss(plRes.data);
      setExpenses(expRes.data.items || []);
      setCategories(catRes.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/finance/expenses", formData);
      setShowForm(false);
      setFormData({ categoryId: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] });
      fetchData();
      toast("Expense added", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete expense?")) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      fetchData();
      toast("Expense deleted", "success");
    } catch (err) { toast("Failed to delete", "error"); }
  };

  const expenseColumns = [
    { key: "date", label: "Date", render: (v: string) => new Date(v).toLocaleDateString() },
    { key: "category", label: "Category", render: (v: any) => v?.name },
    { key: "description", label: "Description", render: (v: string) => v || "-" },
    { key: "amount", label: "Amount", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (_: any, row: any) => (
        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
          <Receipt className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Expenses, cash flow & profitability"
        action={{ label: "Add Expense", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchData}
      />

      {showForm && (
        <FormCard title="New Expense" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Category" required>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Amount" required>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required />
              </FormField>
              <FormField label="Date" required>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </FormField>
              <FormField label="Description">
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Save Expense</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(profitLoss?.revenue || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(profitLoss?.operatingExpenses || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Operating costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(profitLoss?.grossProfit || 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
              Rp {(profitLoss?.grossProfit || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{(profitLoss?.grossMargin || 0).toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(profitLoss?.netProfit || 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
              Rp {(profitLoss?.netProfit || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{(profitLoss?.netMargin || 0).toFixed(1)}% margin</p>
          </CardContent>
        </Card>
      </StatsGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payments Received</span>
                <span className="font-medium text-green-600">Rp {(cashFlow?.paymentsReceived || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses</span>
                <span className="font-medium text-destructive">Rp {(cashFlow?.expenses || 0).toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium">Net Cash Flow</span>
                <span className={`font-bold ${(cashFlow?.netCashFlow || 0) >= 0 ? "text-green-600" : "text-destructive"}`}>
                  Rp {(cashFlow?.netCashFlow || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
          <CardContent>
            {cashFlow?.breakdown?.expensesByCategory?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No expenses this period</p>
            ) : (
              <div className="space-y-2">
                {cashFlow?.breakdown?.expensesByCategory?.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{item.category}</span>
                    <span className="font-medium">Rp {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-4">Loading...</p>
          ) : (
            <ResponsiveTable
              columns={expenseColumns}
              data={expenses}
              emptyMessage="No expenses recorded"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}