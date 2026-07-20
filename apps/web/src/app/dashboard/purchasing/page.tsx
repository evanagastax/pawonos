"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ShoppingCart, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  supplier: { name: string };
  items: any[];
}

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({ supplierId: "", notes: "" });
  const [items, setItems] = useState<any[]>([{ ingredientId: "", quantity: 0, unitCost: 0 }]);

  useEffect(() => { fetchOrders(); fetchSuppliers(); fetchSuggestions(); }, []);

  const fetchOrders = async () => {
    try { const res = await api.get("/purchasing"); setOrders(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSuppliers = async () => {
    try { const res = await api.get("/suppliers"); setSuppliers(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const fetchSuggestions = async () => {
    try { const res = await api.get("/purchasing/suggestions"); setSuggestions(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/purchasing", { ...formData, items: items.filter(i => i.ingredientId) });
      setShowForm(false);
      fetchOrders();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleReceive = async (id: string) => {
    try {
      const order = orders.find(o => o.id === id);
      if (!order) return;
      const receiveItems = order.items.map((item: any) => ({ itemId: item.id, receivedQty: item.quantity }));
      await api.post(`/purchasing/${id}/receive`, { items: receiveItems });
      fetchOrders();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Purchasing</h2><p className="text-muted-foreground">Purchase orders & receiving</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSuggestions(!showSuggestions)}>
            {showSuggestions ? "Hide" : "Suggestions"} ({suggestions.length})
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "New PO"}</Button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card><CardHeader><CardTitle>Purchase Suggestions</CardTitle></CardHeader><CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead><tr className="border-b bg-muted/50"><th className="p-4 text-left font-medium">Item</th><th className="p-4 text-right font-medium">Current</th><th className="p-4 text-right font-medium">Min</th><th className="p-4 text-right font-medium">Suggested</th><th className="p-4 text-right font-medium">Est. Cost</th></tr></thead>
              <tbody>
                {suggestions.map((s: any, i: number) => (
                  <tr key={i} className="border-b"><td className="p-4">{s.name}</td><td className="p-4 text-right">{s.currentStock}</td><td className="p-4 text-right">{s.minimumStock}</td><td className="p-4 text-right">{s.suggestedQuantity}</td><td className="p-4 text-right">Rp {s.estimatedCost?.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      {showForm && (
        <Card><CardHeader><CardTitle>New Purchase Order</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div><label className="text-sm font-medium">Supplier *</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} required>
                <option value="">Select supplier</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Items</label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mt-1">
                  <select className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm" value={item.ingredientId} onChange={(e) => { const newItems = [...items]; newItems[idx].ingredientId = e.target.value; setItems(newItems); }}>
                    <option value="">Select ingredient</option>
                    {/* Will need to fetch ingredients */}
                  </select>
                  <Input type="number" className="w-20" placeholder="Qty" value={item.quantity} onChange={(e) => { const newItems = [...items]; newItems[idx].quantity = Number(e.target.value); setItems(newItems); }} />
                  <Input type="number" className="w-24" placeholder="Unit Cost" value={item.unitCost} onChange={(e) => { const newItems = [...items]; newItems[idx].unitCost = Number(e.target.value); setItems(newItems); }} />
                  <Button type="button" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}>X</Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="mt-2" onClick={() => setItems([...items, { ingredientId: "", quantity: 0, unitCost: 0 }])}>Add Item</Button>
            </div>
            <div><Button type="submit">Create PO</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={fetchOrders}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No purchase orders.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50"><th className="p-4 text-left font-medium">PO #</th><th className="p-4 text-left font-medium">Supplier</th><th className="p-4 text-right font-medium">Amount</th><th className="p-4 text-left font-medium">Date</th><th className="p-4 text-center font-medium">Status</th><th className="p-4 text-center font-medium">Actions</th></tr></thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-4 font-medium">{o.orderNumber}</td>
                      <td className="p-4">{o.supplier?.name}</td>
                      <td className="p-4 text-right">Rp {o.totalAmount?.toLocaleString()}</td>
                      <td className="p-4">{new Date(o.orderDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center"><span className="px-2 py-1 rounded-full text-xs font-medium">{o.status}</span></td>
                      <td className="p-4 text-center">
                        {o.status === "SENT" && <Button size="sm" variant="outline" onClick={() => handleReceive(o.id)}>Receive</Button>}
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