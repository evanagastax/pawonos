"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Users } from "lucide-react";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";

export default function BranchesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Branches" description="Multi-branch management (coming soon)" />

      <StatsGrid columns={3}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Kitchen</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Main Location</span></div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Active</span></div>
            </div>
          </CardContent>
        </Card>
      </StatsGrid>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Multi-branch support coming soon.</p>
          <p className="text-sm text-muted-foreground">Currently running single branch mode.</p>
        </CardContent>
      </Card>
    </div>
  );
}