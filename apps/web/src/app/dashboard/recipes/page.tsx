"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BookOpen, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/api";

interface RecipeItem {
  id: string;
  quantity: number;
  ingredient: { id: string; name: string; unit: { symbol: string } } | null;
  packaging: { id: string; name: string; unit: { symbol: string } } | null;
  unit: { symbol: string };
}

interface RecipeVersion {
  id: string;
  version: number;
  yield: number;
  totalCost: number;
  items: RecipeItem[];
  steps: any[];
}

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  currentVersion: number;
  versions: RecipeVersion[];
  _count: { menuItems: number };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [packaging, setPackaging] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [itemData, setItemData] = useState({ ingredientId: "", packagingId: "", quantity: 0, unitId: "", type: "ingredient" });

  useEffect(() => { fetchRecipes(); fetchIngredients(); fetchPackaging(); fetchUnits(); }, []);

  const fetchRecipes = async () => {
    try {
      const res = await api.get("/recipes");
      const items = res.data.items || [];
      // Fetch versions for each recipe
      for (const recipe of items) {
        try {
          const vRes = await api.get(`/recipes/${recipe.id}/versions`);
          recipe.versions = vRes.data || [];
        } catch { recipe.versions = []; }
      }
      setRecipes(items);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchIngredients = async () => {
    try { const res = await api.get("/ingredients"); setIngredients(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const fetchPackaging = async () => {
    try { const res = await api.get("/packaging"); setPackaging(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const fetchUnits = async () => {
    try { const res = await api.get("/ingredients/units"); setUnits(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/recipes", formData);
      setShowForm(false);
      setFormData({ name: "", description: "" });
      fetchRecipes();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleCreateVersion = async (recipeId: string) => {
    try {
      await api.post(`/recipes/${recipeId}/versions`, { yield: 1 });
      fetchRecipes();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleAddItem = async (recipeId: string, versionId: string) => {
    try {
      const payload: any = {
        quantity: itemData.quantity,
        unitId: itemData.unitId,
      };
      if (itemData.type === "ingredient") payload.ingredientId = itemData.ingredientId;
      else payload.packagingId = itemData.packagingId;

      await api.post(`/recipes/${recipeId}/versions/${versionId}/items`, payload);
      setShowAddItem(null);
      setItemData({ ingredientId: "", packagingId: "", quantity: 0, unitId: "", type: "ingredient" });
      fetchRecipes();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleDeleteItem = async (recipeId: string, versionId: string, itemId: string) => {
    try {
      await api.delete(`/recipes/${recipeId}/versions/${versionId}/items/${itemId}`);
      fetchRecipes();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete recipe?")) return;
    try { await api.delete(`/recipes/${id}`); fetchRecipes(); }
    catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Recipes</h2><p className="text-muted-foreground">Manage recipes with ingredients</p></div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "Add Recipe"}</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>New Recipe</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">Description</label><Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            <div><Button type="submit">Save Recipe</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Button variant="outline" onClick={fetchRecipes}>Refresh</Button>
          </div>

          {loading ? <p className="text-center py-8">Loading...</p> : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8"><BookOpen className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-sm text-muted-foreground">No recipes found.</p></div>
          ) : (
            <div className="space-y-4">
              {recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map((recipe) => {
                const version = recipe.versions?.[0];
                const isExpanded = expandedRecipe === recipe.id;
                return (
                  <Card key={recipe.id} className="overflow-hidden">
                    <CardHeader className="cursor-pointer" onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{recipe.description || "No description"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">v{recipe.currentVersion}</span>
                          {version && <span className="text-sm font-medium">HPP: Rp {version.totalCost?.toLocaleString()}</span>}
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && version && (
                      <CardContent className="border-t">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Ingredients (v{version.version})</h4>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleCreateVersion(recipe.id)}>New Version</Button>
                            <Button size="sm" onClick={() => setShowAddItem(recipe.id)}>
                              <Plus className="h-4 w-4 mr-1" /> Add Ingredient
                            </Button>
                          </div>
                        </div>

                        {showAddItem === recipe.id && (
                          <Card className="mb-4 bg-muted/50">
                            <CardContent className="pt-4">
                              <div className="grid gap-3 md:grid-cols-5">
                                <div>
                                  <select className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={itemData.type} onChange={(e) => setItemData({ ...itemData, type: e.target.value, ingredientId: "", packagingId: "" })}>
                                    <option value="ingredient">Ingredient</option>
                                    <option value="packaging">Packaging</option>
                                  </select>
                                </div>
                                <div>
                                  {itemData.type === "ingredient" ? (
                                    <select className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={itemData.ingredientId} onChange={(e) => setItemData({ ...itemData, ingredientId: e.target.value })}>
                                      <option value="">Select ingredient</option>
                                      {ingredients.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                                    </select>
                                  ) : (
                                    <select className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={itemData.packagingId} onChange={(e) => setItemData({ ...itemData, packagingId: e.target.value })}>
                                      <option value="">Select packaging</option>
                                      {packaging.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                  )}
                                </div>
                                <div><Input type="number" placeholder="Quantity" value={itemData.quantity} onChange={(e) => setItemData({ ...itemData, quantity: Number(e.target.value) })} /></div>
                                <div>
                                  <select className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm" value={itemData.unitId} onChange={(e) => setItemData({ ...itemData, unitId: e.target.value })}>
                                    <option value="">Unit</option>
                                    {units.map((u: any) => <option key={u.id} value={u.id}>{u.symbol}</option>)}
                                  </select>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => handleAddItem(recipe.id, version.id)}>Add</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setShowAddItem(null)}>Cancel</Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {version.items?.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4">No ingredients added yet.</p>
                        ) : (
                          <div className="rounded-md border">
                            <table className="w-full">
                              <thead><tr className="border-b bg-muted/50">
                                <th className="p-3 text-left font-medium">Item</th>
                                <th className="p-3 text-left font-medium">Type</th>
                                <th className="p-3 text-right font-medium">Quantity</th>
                                <th className="p-3 text-left font-medium">Unit</th>
                                <th className="p-3 text-center font-medium">Action</th>
                              </tr></thead>
                              <tbody>
                                {version.items?.map((item) => (
                                  <tr key={item.id} className="border-b">
                                    <td className="p-3 font-medium">{item.ingredient?.name || item.packaging?.name}</td>
                                    <td className="p-3 text-muted-foreground">{item.ingredient ? "Ingredient" : "Packaging"}</td>
                                    <td className="p-3 text-right">{item.quantity}</td>
                                    <td className="p-3">{item.unit?.symbol}</td>
                                    <td className="p-3 text-center">
                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(recipe.id, version.id, item.id)}>
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
                    )}

                    {isExpanded && !version && (
                      <CardContent className="border-t">
                        <p className="text-sm text-muted-foreground">No versions yet.</p>
                        <Button size="sm" className="mt-2" onClick={() => handleCreateVersion(recipe.id)}>Create Version 1</Button>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}