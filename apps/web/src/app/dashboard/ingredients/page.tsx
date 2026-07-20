"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";

interface Ingredient {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: number;
  minimumStock: number;
  category: { id: string; name: string };
  unit: { id: string; name: string; symbol: string };
  inventory: { currentStock: number } | null;
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", sku: "", categoryId: "", unitId: "", purchasePrice: 0, minimumStock: 0,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => { fetchIngredients(); fetchCategories(); fetchUnits(); }, []);

  const fetchIngredients = async () => {
    try {
      const res = await api.get("/ingredients", { params: { search } });
      setIngredients(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try { const res = await api.get("/ingredients/categories"); setCategories(res.data || []); }
    catch (err) { console.error(err); }
  };

  const fetchUnits = async () => {
    try { const res = await api.get("/ingredients/units"); setUnits(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/ingredients", formData);
      setShowForm(false);
      setFormData({ name: "", sku: "", categoryId: "", unitId: "", purchasePrice: 0, minimumStock: 0 });
      fetchIngredients();
      toast("Ingredient created", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ingredient?")) return;
    try {
      await api.delete(`/ingredients/${id}`);
      fetchIngredients();
      toast("Ingredient deleted", "success");
    } catch (err) { toast("Failed to delete ingredient", "error"); }
  };

  const columns = [
    { key: "name", label: "Name", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "sku", label: "SKU", render: (v: string) => v || "-" },
    { key: "category", label: "Category", render: (v: any) => v?.name },
    { key: "unit", label: "Unit", render: (v: any) => v?.symbol },
    { key: "purchasePrice", label: "Price", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    { key: "inventory", label: "Stock", align: "right" as const, render: (v: any) => v?.currentStock || 0 },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (_: any, row: any) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredients"
        description="Manage your ingredient master data"
        action={{ label: "Add Ingredient", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchIngredients}
      />

      {showForm && (
        <FormCard title="New Ingredient" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Name" required>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="SKU">
                <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
              </FormField>
              <FormField label="Category" required>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Unit" required>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.unitId} onChange={(e) => setFormData({ ...formData, unitId: e.target.value })} required>
                  <option value="">Select unit</option>
                  {units.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </FormField>
              <FormField label="Purchase Price">
                <Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} />
              </FormField>
              <FormField label="Minimum Stock">
                <Input type="number" value={formData.minimumStock} onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })} />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Save Ingredient</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingredients</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{ingredients.length}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={ingredients}
          emptyMessage="No ingredients found. Click 'Add Ingredient' to create your first ingredient."
        />
      )}
    </div>
  );
}