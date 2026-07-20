"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Truck, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  _count: { ingredients: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", contactName: "", phone: "", email: "", address: "" });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    try { const res = await api.get("/suppliers", { params: { search } }); setSuppliers(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/suppliers", formData);
      setShowForm(false);
      setFormData({ name: "", contactName: "", phone: "", email: "", address: "" });
      fetchSuppliers();
      toast("Supplier added", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/suppliers/${id}`); fetchSuppliers(); toast("Supplier deleted", "success"); }
    catch { toast("Failed", "error"); }
  };

  const columns = [
    { key: "name", label: "Name", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "contactName", label: "Contact", render: (v: string) => v || "-" },
    { key: "phone", label: "Phone", render: (v: string) => v || "-" },
    { key: "email", label: "Email", render: (v: string) => v || "-" },
    { key: "_count", label: "Ingredients", align: "center" as const, render: (v: any) => v?.ingredients || 0 },
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
        title="Suppliers"
        description="Manage supplier contacts"
        action={{ label: "Add Supplier", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchSuppliers}
      />

      {showForm && (
        <FormCard title="New Supplier" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Name" required>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="Contact">
                <Input value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
              </FormField>
              <FormField label="Phone">
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </FormField>
              <FormField label="Address" className="md:col-span-2">
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Save Supplier</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{suppliers.length}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={suppliers}
          emptyMessage="No suppliers found. Click 'Add Supplier' to create your first supplier."
        />
      )}
    </div>
  );
}