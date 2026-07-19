"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, TrendingDown, Plus, X, Receipt } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

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
    categoryId: "",
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
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
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete expense?")) return;
    try {
      await api.delete(`/finance/expenses/${id}`);
      fetchData();
      toast("Expense deleted", "success");
    } catch (err) {
      toast("Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
          <p className="text-muted-foreground">Expenses, cash flow & profitability</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "Add Expense"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Expense</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Save Expense</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* P&L Summary */}
      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">COGS</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(profitLoss?.cogs || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cost of goods sold</p>
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
      </div>

      {/* Cash Flow */}
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

      {/* Recent Expenses */}
      <Card>
        <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No expenses recorded</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-left font-medium">Description</th>
                  <th className="p-3 text-right font-medium">Amount</th>
                  <th className="p-3 text-center font-medium">Action</th>
                </tr></thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b">
                      <td className="p-3">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="p-3">{exp.category?.name}</td>
                      <td className="p-3 text-muted-foreground">{exp.description || "-"}</td>
                      <td className="p-3 text-right font-medium">Rp {exp.amount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                          <Receipt className="h-4 w-4 text-destructive" />
                        </Button>
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