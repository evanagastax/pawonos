"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Warehouse, AlertTriangle, Package } from "lucide-react";
import api from "@/lib/api";`nimport { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  currentStock: number;
  reservedStock: number;
  averageCost: number;
  ingredient: { id: string; name: string; minimumStock: number; unit: { symbol: string } } | null;
  packaging: { id: string; name: string; minimumStock: number; unit: { symbol: string } } | null;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [showPurchase, setShowPurchase] = useState<string | null>(null);
  const [purchaseData, setPurchaseData] = useState({ quantity: 0, unitCost: 0 });

  useEffect(() => { fetchInventory(); }, [type]);

  const fetchInventory = async () => {
    try {
      const res = await api.get("/inventory", { params: { type } });
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handlePurchase = async (id: string) => {
    try {
      await api.post(`/inventory/${id}/purchase`, purchaseData);
      setShowPurchase(null);
      setPurchaseData({ quantity: 0, unitCost: 0 });
      fetchInventory();
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const lowStock = items.filter(i => {
    const name = i.ingredient?.name || i.packaging?.name;
    const minStock = i.ingredient?.minimumStock || i.packaging?.minimumStock || 0;
    return i.currentStock <= minStock;
  });

  const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.averageCost, 0);

  return (
    <div className="space-y-6">
      <div><h2 className="text-3xl font-bold tracking-tight">Inventory</h2><p className="text-muted-foreground">Stock management</p></div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Items</CardTitle><Warehouse className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{items.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Low Stock</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{lowStock.length}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Value</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">Rp {totalValue.toLocaleString()}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              <option value="ingredient">Ingredients</option>
              <option value="packaging">Packaging</option>
            </select>
            <Button variant="outline" onClick={fetchInventory}>Refresh</Button>
          </div>
          {loading ? <p className="text-center py-8">Loading...</p> : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><Warehouse className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No inventory items.</p></div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead><tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Type</th>
                  <th className="p-4 text-left font-medium">Unit</th>
                  <th className="p-4 text-right font-medium">Stock</th>
                  <th className="p-4 text-right font-medium">Reserved</th>
                  <th className="p-4 text-right font-medium">Avg Cost</th>
                  <th className="p-4 text-right font-medium">Value</th>
                  <th className="p-4 text-center font-medium">Status</th>
                  <th className="p-4 text-center font-medium">Action</th>
                </tr></thead>
                <tbody>
                  {items.map((item) => {
                    const name = item.ingredient?.name || item.packaging?.name || "Unknown";
                    const unit = item.ingredient?.unit?.symbol || item.packaging?.unit?.symbol || "";
                    const minStock = item.ingredient?.minimumStock || item.packaging?.minimumStock || 0;
                    const isLow = item.currentStock <= minStock;
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-4 font-medium">{name}</td>
                        <td className="p-4">{item.ingredient ? "Ingredient" : "Packaging"}</td>
                        <td className="p-4">{unit}</td>
                        <td className="p-4 text-right">{item.currentStock}</td>
                        <td className="p-4 text-right">{item.reservedStock}</td>
                        <td className="p-4 text-right">Rp {item.averageCost?.toLocaleString()}</td>
                        <td className="p-4 text-right">Rp {(item.currentStock * item.averageCost).toLocaleString()}</td>
                        <td className="p-4 text-center">{isLow ? <span className="text-destructive text-xs font-medium">LOW</span> : <span className="text-green-600 text-xs font-medium">OK</span>}</td>
                        <td className="p-4 text-center">
                          {showPurchase === item.id ? (
                            <div className="flex gap-1">
                              <Input type="number" className="w-20" placeholder="Qty" value={purchaseData.quantity} onChange={(e) => setPurchaseData({ ...purchaseData, quantity: Number(e.target.value) })} />
                              <Input type="number" className="w-24" placeholder="Cost" value={purchaseData.unitCost} onChange={(e) => setPurchaseData({ ...purchaseData, unitCost: Number(e.target.value) })} />
                              <Button size="sm" onClick={() => handlePurchase(item.id)}>OK</Button>
                              <Button size="sm" variant="ghost" onClick={() => setShowPurchase(null)}>X</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setShowPurchase(item.id)}>Purchase</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}