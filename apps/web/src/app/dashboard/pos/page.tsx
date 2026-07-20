"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, DollarSign } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  sellingPrice: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function PosPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailySales, setDailySales] = useState<any>(null);

  useEffect(() => { fetchMenu(); fetchSales(); }, []);

  const fetchMenu = async () => {
    try { const res = await api.get("/pos/menu"); setMenu(res.data || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSales = async () => {
    try { const res = await api.get("/pos/daily-sales"); setDailySales(res.data); }
    catch (err) { console.error(err); }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      await api.post("/pos/order", { items: cart.map(c => ({ menuItemId: c.id, quantity: c.quantity })) });
      setCart([]);
      fetchSales();
      toast("Order completed", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* Menu */}
      <div className="flex-1 overflow-auto">
        <h2 className="text-2xl font-bold mb-4">Menu</h2>
        {loading ? <p>Loading...</p> : (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {menu.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow active:scale-95" onClick={() => addToCart(item)}>
                <CardContent className="p-3 md:p-4">
                  <p className="font-medium text-sm md:text-base">{item.name}</p>
                  <p className="text-lg font-bold mt-1">Rp {item.sellingPrice.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="w-full lg:w-96 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cart</span>
              <span className="text-sm font-normal text-muted-foreground">{totalItems} items</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Empty cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Rp {item.sellingPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total</span>
              <span className="text-xl font-bold">Rp {total.toLocaleString()}</span>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={cart.length === 0}>
              <DollarSign className="mr-2 h-4 w-4" /> Checkout
            </Button>
          </div>
        </Card>

        {/* Daily Sales */}
        {dailySales && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Sales:</span> Rp {dailySales.totalSales.toLocaleString()}</div>
                <div><span className="text-muted-foreground">Orders:</span> {dailySales.totalOrders}</div>
                <div><span className="text-muted-foreground">Items:</span> {dailySales.totalItems}</div>
                <div><span className="text-muted-foreground">Avg:</span> Rp {dailySales.averageOrderValue.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}