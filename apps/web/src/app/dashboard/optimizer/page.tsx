"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";

export default function OptimizerPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [versions, setVersions] = useState<any[]>([]);
  const [budget, setBudget] = useState(20000);
  const [targetMargin, setTargetMargin] = useState(0.25);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    try {
      const res = await api.get("/recipes");
      setRecipes(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchVersions = async (recipeId: string) => {
    try {
      const res = await api.get("/recipes/" + recipeId + "/versions");
      setVersions(res.data || []);
      if (res.data?.length > 0) setSelectedVersion(res.data[0].id);
    } catch (err) { console.error(err); }
  };

  const handleRecipeChange = (recipeId: string) => {
    setSelectedRecipe(recipeId);
    if (recipeId) fetchVersions(recipeId);
    else { setVersions([]); setSelectedVersion(""); }
  };

  const handleOptimize = async () => {
    if (!selectedVersion) return;
    setLoading(true);
    try {
      const res = await api.post("/cost-engine/optimize", {
        recipeVersionId: selectedVersion,
        budget,
        targetMargin,
      });
      setResult(res.data);
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
    finally { setLoading(false); }
  };

  const suggestionColumns = [
    { key: "type", label: "Type", render: (v: string) => <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">{v}</span> },
    { key: "description", label: "Description" },
    { key: "savings", label: "Savings", align: "right" as const, render: (v: number) => <span className="font-medium text-green-600">Rp {v?.toLocaleString()}</span> },
    { key: "qualityImpact", label: "Quality", align: "center" as const, render: (v: string) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${v === "low" ? "bg-green-100 text-green-800" : v === "medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
        {v}
      </span>
    )},
    { key: "confidence", label: "Confidence", align: "right" as const, render: (v: number) => `${Math.round(v * 100)}%` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Budget Optimizer" description="Optimize recipes to meet budget targets" />

      <Card>
        <CardHeader><CardTitle>Optimization Parameters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <FormField label="Recipe *">
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedRecipe} onChange={(e) => handleRecipeChange(e.target.value)}>
                <option value="">Select recipe</option>
                {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </FormField>
            <FormField label="Version *">
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)}>
                <option value="">Select version</option>
                {versions.map((v: any) => <option key={v.id} value={v.id}>v{v.version} (HPP: Rp {v.totalCost?.toLocaleString()})</option>)}
              </select>
            </FormField>
            <FormField label="Customer Budget (Rp)">
              <Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </FormField>
            <FormField label="Target Margin (%)">
              <Input type="number" value={targetMargin * 100} onChange={(e) => setTargetMargin(Number(e.target.value) / 100)} />
            </FormField>
          </div>
          <Button className="mt-4" onClick={handleOptimize} disabled={!selectedVersion || loading}>
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <StatsGrid>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">Rp {result.budget?.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max HPP</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">Rp {result.maxHpp?.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current HPP</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">Rp {result.currentHpp?.toLocaleString()}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                {result.withinBudget ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-destructive" />}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${result.withinBudget ? "text-green-600" : "text-destructive"}`}>
                  {result.withinBudget ? "Within Budget" : "Over Budget"}
                </div>
                {!result.withinBudget && <p className="text-sm text-muted-foreground">Need to save Rp {result.difference?.toLocaleString()}</p>}
              </CardContent>
            </Card>
          </StatsGrid>

          {result.suggestions?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Optimization Suggestions</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveTable columns={suggestionColumns} data={result.suggestions} emptyMessage="No suggestions" />
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Total Potential Savings: <span className="text-green-600">Rp {result.suggestions.reduce((sum: number, s: any) => sum + (s.savings || 0), 0).toLocaleString()}</span></p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}