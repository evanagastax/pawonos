"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, AlertTriangle, Star } from "lucide-react";
import api from "@/lib/api";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";

export default function CrmPage() {
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = useState<any[]>([]);
  const [segmentation, setSegmentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [topRes, inactiveRes, segRes] = await Promise.all([
        api.get("/crm/top-customers"),
        api.get("/crm/inactive-customers"),
        api.get("/crm/segmentation"),
      ]);
      setTopCustomers(topRes.data || []);
      setInactiveCustomers(inactiveRes.data || []);
      setSegmentation(segRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="CRM" description="Customer relationship management" onRefresh={fetchData} />

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentation?.vip?.count || 0}</div>
            <p className="text-xs text-muted-foreground">50+ orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentation?.regular?.count || 0}</div>
            <p className="text-xs text-muted-foreground">10-50 orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occasional</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentation?.occasional?.count || 0}</div>
            <p className="text-xs text-muted-foreground">3-9 orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{segmentation?.new?.count || 0}</div>
            <p className="text-xs text-muted-foreground">1-2 orders</p>
          </CardContent>
        </Card>
      </StatsGrid>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />Top Customers</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-4">Loading...</p> : topCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No data</p>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.company || "-"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{c.totalOrders} orders</p>
                      <p className="text-xs text-muted-foreground">Rp {c.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" />Inactive Customers (30d)</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-center py-4">Loading...</p> : inactiveCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">All customers active</p>
            ) : (
              <div className="space-y-3">
                {inactiveCustomers.slice(0, 10).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.company || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-destructive">{c.daysSinceLastOrder} days</p>
                      <p className="text-xs text-muted-foreground">since last order</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}