"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, UtensilsCrossed, Trash2, X } from "lucide-react";
import api from "@/lib/api";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  sellingPrice: number;
  recipe: { name: string };
  recipeVersion: { version: number };
}

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", recipeId: "", recipeVersionId: "", sellingPrice: 0 });
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => { fetchItems(); fetchRecipes(); }, []);

  const fetchItems = async () => {
    try { const res = await api.get("/menu-items", { params: { search } }); setItems(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchRecipes = async () => {
    try { const res = await api.get("/recipes"); setRecipes(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const fetchVersions = async (recipeId: string) => {
    try { const res = await api.get(`/recipes/${recipeId}/versions`); setVersions(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleRecipeChange = (recipeId: string) => {
    setFormData({ ...formData, recipeId, recipeVersionId: "" });
    if (recipeId) fetchVersions(recipeId);
    else setVersions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/menu-items", formData);
      setShowForm(false);
      setFormData({ name: "", description: "", recipeId: "", recipeVersionId: "", sellingPrice: 0 });
      fetchItems();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/menu-items/${id}`); fetchItems(); }
    catch { alert("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Menu Items</h2><p className="text-muted-foreground">Customer-visible products</p></div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "Add Menu Item"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Menu Item</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div><label className="text-sm font-medium">Name *</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div><label className="text-sm font-medium">Selling Price *</label><Input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} required /></div>
              <div><label className="text-sm font-medium">Recipe *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.recipeId} onChange={(e) => handleRecipeChange(e.target.value)} required>
                  <option value="">Select recipe</option>
                  {recipes.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium">Version *</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.recipeVersionId} onChange={(e) => setFormData({ ...formData, recipeVersionId: e.target.value })} required>
                  <option value="">Select version</option>
                  {versions.map((v: any) => <option key={v.id} value={v.id}>v{v.version} (HPP: Rp {v.totalCost?.toLocaleString()})</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><label className="text-sm font-medium">Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              <div className="md:col-span-2"><Button type="submit">Save Menu Item</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Button variant="outline" onClick={fetchItems}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No menu items found.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50"><th className="p-4 text-left font-medium">Name</th><th className="p-4 text-left font-medium">Recipe</th><th className="p-4 text-left font-medium">Version</th><th className="p-4 text-right font-medium">Price</th><th className="p-4 text-center font-medium">Actions</th></tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4">{item.recipe?.name}</td>
                      <td className="p-4">v{item.recipeVersion?.version}</td>
                      <td className="p-4 text-right">Rp {item.sellingPrice?.toLocaleString()}</td>
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