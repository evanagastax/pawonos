"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import api from "@/lib/api";

export default function CalendarPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({ date: "", mealTemplateId: "", notes: "" });

  useEffect(() => { fetchEntries(); fetchTemplates(); }, []);

  const fetchEntries = async () => {
    try { const res = await api.get("/meal-calendar"); setEntries(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTemplates = async () => {
    try { const res = await api.get("/meal-templates"); setTemplates(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/meal-calendar", formData);
      setShowForm(false);
      setFormData({ date: "", mealTemplateId: "", notes: "" });
      fetchEntries();
    } catch (err: any) { alert(err.response?.data?.message || "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/meal-calendar/${id}`); fetchEntries(); }
    catch { alert("Failed"); }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getEntryForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.find(e => e.date?.startsWith(dateStr));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold tracking-tight">Meal Calendar</h2><p className="text-muted-foreground">Schedule meals for production</p></div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showForm ? "Cancel" : "Schedule Meal"}</Button>
      </div>

      {showForm && (
        <Card><CardHeader><CardTitle>Schedule Meal</CardTitle></CardHeader><CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div><label className="text-sm font-medium">Date *</label><input type="date" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
            <div><label className="text-sm font-medium">Template *</label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.mealTemplateId} onChange={(e) => setFormData({ ...formData, mealTemplateId: e.target.value })} required>
                <option value="">Select template</option>
                {templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><Button type="submit">Save</Button></div>
          </form>
        </CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <CardTitle>{monthName}</CardTitle>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-muted-foreground">{day}</div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const entry = getEntryForDay(day);
              return (
                <div key={day} className={`p-2 border rounded-lg min-h-[80px] cursor-pointer hover:bg-accent ${entry ? 'bg-primary/10' : ''}`}>
                  <div className="text-sm font-medium">{day}</div>
                  {entry && (
                    <div className="text-xs mt-1">
                      <div className="font-medium truncate">{entry.mealTemplate?.name}</div>
                      <Button variant="ghost" size="icon" className="h-4 w-4 mt-1" onClick={() => handleDelete(entry.id)}><X className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}