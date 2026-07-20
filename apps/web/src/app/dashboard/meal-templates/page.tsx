"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ClipboardList, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string | null;
  items: any[];
  _count: { orders: number; calendar: number };
}

export default function MealTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [addItemData, setAddItemData] = useState({ menuItemId: "", quantity: 1 });

  useEffect(() => { fetchTemplates(); fetchMenuItems(); }, []);

  const fetchTemplates = async () => {
    try { const res = await api.get("/meal-templates"); setTemplates(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMenuItems = async () => {
    try { const res = await api.get("/menu-items"); setMenuItems(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/meal-templates", formData);
      setShowForm(false);
      setFormData({ name: "", description: "" });
      fetchTemplates();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleAddItem = async (templateId: string) => {
    try {
      await api.post(`/meal-templates/${templateId}/items`, addItemData);
      setAddItemData({ menuItemId: "", quantity: 1 });
      fetchTemplates();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/meal-templates/${id}`); fetchTemplates(); }
    catch { toast("Failed", "error"); }
  };

  const handleDeleteItem = async (templateId: string, itemId: string) => {
    try { await api.delete(`/meal-templates/${templateId}/items/${itemId}`); fetchTemplates(); }
    catch { toast("Failed", "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Meal Templates</h2><p className="text-muted-foreground">Bundle menu items into packages</p></div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "Add Template"}</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Template</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Button type="submit">Save Template</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Button variant="outline" onClick={fetchTemplates}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><ClipboardList className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No templates found.</p></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id} className="hover:shadow-md transition-shadow">
                  <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">{t.name}</CardTitle><Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{t.description || "No description"}</p>
                    <div className="text-sm mb-2">Items: {t.items?.length || 0} | Orders: {t._count?.orders || 0}</div>
                    {t.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-sm py-1 border-t">
                        <span>{item.menuItem?.name} x{item.quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(t.id, item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <select className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm" value={addItemData.menuItemId} onChange={(e) => setAddItemData({ ...addItemData, menuItemId: e.target.value })}>
                        <option value="">Add item...</option>
                        {menuItems.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <Input type="number" className="w-16" value={addItemData.quantity} onChange={(e) => setAddItemData({ ...addItemData, quantity: Number(e.target.value) })} />
                      <Button size="sm" onClick={() => handleAddItem(t.id)}>+</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}