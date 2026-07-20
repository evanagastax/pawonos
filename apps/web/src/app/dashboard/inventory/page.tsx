"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Warehouse, AlertTriangle, Package } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";

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
      toast("Purchase recorded", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const lowStock = items.filter(i => {
    const minStock = i.ingredient?.minimumStock || i.packaging?.minimumStock || 0;
    return i.currentStock <= minStock;
  });

  const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.averageCost, 0);

  const columns = [
    { key: "name", label: "Name", render: (_: any, row: any) => <span className="font-medium">{row.ingredient?.name || row.packaging?.name}</span> },
    { key: "type", label: "Type", render: (_: any, row: any) => row.ingredient ? "Ingredient" : "Packaging" },
    { key: "unit", label: "Unit", render: (_: any, row: any) => row.ingredient?.unit?.symbol || row.packaging?.unit?.symbol },
    { key: "currentStock", label: "Stock", align: "right" as const },
    { key: "reservedStock", label: "Reserved", align: "right" as const },
    { key: "averageCost", label: "Avg Cost", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    {
      key: "status",
      label: "Status",
      align: "center" as const,
      render: (_: any, row: any) => {
        const minStock = row.ingredient?.minimumStock || row.packaging?.minimumStock || 0;
        const isLow = row.currentStock <= minStock;
        return isLow
          ? <span className="text-destructive text-xs font-medium">LOW</span>
          : <span className="text-green-600 text-xs font-medium">OK</span>;
      },
    },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (_: any, row: any) => (
        showPurchase === row.id ? (
          <div className="flex gap-1">
            <Input type="number" className="w-20" placeholder="Qty" value={purchaseData.quantity} onChange={(e) => setPurchaseData({ ...purchaseData, quantity: Number(e.target.value) })} />
            <Input type="number" className="w-24" placeholder="Cost" value={purchaseData.unitCost} onChange={(e) => setPurchaseData({ ...purchaseData, unitCost: Number(e.target.value) })} />
            <Button size="sm" onClick={() => handlePurchase(row.id)}>OK</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowPurchase(null)}>X</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowPurchase(row.id)}>Purchase</Button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="Stock management" onRefresh={fetchInventory} />

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{items.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">{lowStock.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">Rp {totalValue.toLocaleString()}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All</option>
          <option value="ingredient">Ingredients</option>
          <option value="packaging">Packaging</option>
        </select>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={items}
          emptyMessage="No inventory items found."
        />
      )}
    </div>
  );
}