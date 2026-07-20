"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Customer {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  _count: { orders: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", company: "", phone: "", email: "", address: "", notes: "" });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try { const res = await api.get("/customers", { params: { search } }); setCustomers(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/customers", formData);
      setShowForm(false);
      setFormData({ name: "", company: "", phone: "", email: "", address: "", notes: "" });
      fetchCustomers();
      toast("Customer added", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/customers/${id}`); fetchCustomers(); toast("Customer deleted", "success"); }
    catch { toast("Failed", "error"); }
  };

  const columns = [
    { key: "name", label: "Name", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "company", label: "Company", render: (v: string) => v || "-" },
    { key: "phone", label: "Phone", render: (v: string) => v || "-" },
    { key: "email", label: "Email", render: (v: string) => v || "-" },
    { key: "_count", label: "Orders", align: "center" as const, render: (v: any) => v?.orders || 0 },
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
        title="Customers"
        description="Manage customer contacts"
        action={{ label: "Add Customer", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchCustomers}
      />

      {showForm && (
        <FormCard title="New Customer" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Name" required>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="Company">
                <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
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
              <Button type="submit">Save Customer</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{customers.length}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={customers}
          emptyMessage="No customers found. Click 'Add Customer' to create your first customer."
        />
      )}
    </div>
  );
}