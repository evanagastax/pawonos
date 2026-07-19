"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Truck, Trash2, X } from "lucide-react";
import api from "@/lib/api";

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
    try {
      const res = await api.get("/suppliers", { params: { search } });
      setSuppliers(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/suppliers", formData);
      setShowForm(false);
      setFormData({ name: "", contactName: "", phone: "", email: "", address: "" });
      fetchSuppliers();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/suppliers/${id}`); fetchSuppliers(); }
    catch { alert("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground">Manage supplier contacts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "Add Supplier"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Supplier</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Contact</label>
                <Input value={formData.contactName} onChange={(e) => setFormData({ ...formData, contactName: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Save Supplier</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" onClick={fetchSuppliers}>Refresh</Button>
          </div>

          {loading ? <p className="text-center py-8">Loading...</p> : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No suppliers found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-4 text-left font-medium">Name</th>
                    <th className="p-4 text-left font-medium">Contact</th>
                    <th className="p-4 text-left font-medium">Phone</th>
                    <th className="p-4 text-left font-medium">Email</th>
                    <th className="p-4 text-center font-medium">Ingredients</th>
                    <th className="p-4 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4">{s.contactName || "-"}</td>
                      <td className="p-4">{s.phone || "-"}</td>
                      <td className="p-4">{s.email || "-"}</td>
                      <td className="p-4 text-center">{s._count?.ingredients || 0}</td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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