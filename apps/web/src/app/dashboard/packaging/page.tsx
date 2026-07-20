"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Box, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      toast("Packaging added", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/packaging/${id}`); fetchItems(); toast("Packaging deleted", "success"); }
    catch { toast("Failed", "error"); }
  };

  const columns = [
    { key: "name", label: "Name", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "sku", label: "SKU", render: (v: string) => v || "-" },
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
        title="Packaging"
        description="Manage packaging materials"
        action={{ label: "Add Packaging", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchItems}
      />

      {showForm && (
        <FormCard title="New Packaging" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Name" required>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="SKU">
                <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
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
              <Button type="submit">Save Packaging</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{items.length}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search packaging..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={items}
          emptyMessage="No packaging found. Click 'Add Packaging' to create your first item."
        />
      )}
    </div>
  );
}