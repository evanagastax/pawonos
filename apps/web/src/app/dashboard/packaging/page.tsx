"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Box, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface PackagingItem {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: number;
  minimumStock: number;
  unit: { name: string; symbol: string };
  inventory: { currentStock: number } | null;
}

export default function PackagingPage() {
  const [items, setItems] = useState<PackagingItem[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", sku: "", unitId: "", purchasePrice: 0, minimumStock: 0 });

  useEffect(() => { fetchItems(); fetchUnits(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get("/packaging", { params: { search } }); setItems(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUnits = async () => {
    try { const res = await api.get("/ingredients/units"); setUnits(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/packaging", formData);
      setShowForm(false);
      setFormData({ name: "", sku: "", unitId: "", purchasePrice: 0, minimumStock: 0 });
      fetchItems();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/packaging/${id}`); fetchItems(); }
    catch { toast("Failed", "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Packaging</h2><p className="text-muted-foreground">Manage packaging materials</p></div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "Add Packaging"}</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Packaging</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div><label className="text-sm font-medium">Name *</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">SKU</label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} /></div>
            <div><label className="text-sm font-medium">Unit *</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: e.target.value })} required>
                <option value="">Select unit</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium">Purchase Price</label><Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} /></div>
            <div><label className="text-sm font-medium">Minimum Stock</label><Input type="number" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })} /></div>
            <div className="md:col-span-2"><Button type="submit">Save Packaging</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Button variant="outline" onClick={fetchItems}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><Box className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No packaging found.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50"><th className="p-4 text-left font-medium">Name</th><th className="p-4 text-left font-medium">SKU</th><th className="p-4 text-left font-medium">Unit</th><th className="p-4 text-right font-medium">Price</th><th className="p-4 text-right font-medium">Stock</th><th className="p-4 text-center font-medium">Actions</th></tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-muted-foreground">{item.sku || "-"}</td>
                      <td className="p-4">{item.unit?.symbol}</td>
                      <td className="p-4 text-right">Rp {item.purchasePrice?.toLocaleString()}</td>
                      <td className="p-4 text-right">{item.inventory?.currentStock || 0}</td>
                      <td className="p-4 text-center"><Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
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