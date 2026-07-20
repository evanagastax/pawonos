"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Trash2, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader, StatsGrid, FilterBar } from "@/components/ui/page-header";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { FormCard, FormGrid, FormField, FormActions } from "@/components/ui/form-layout";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeCode: "", name: "", email: "", phone: "", position: "",
    department: "", joinDate: "", salary: 0, bankName: "", bankAccount: "",
  });

  useEffect(() => { fetchEmployees(); fetchDepartments(); }, []);

  const fetchEmployees = async () => {
    try { const res = await api.get("/employees", { params: { search } }); setEmployees(res.data.items || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try { const res = await api.get("/employees/departments"); setDepartments(res.data || []); }
    catch (err) { console.error(err); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/employees", formData);
      setShowForm(false);
      setFormData({ employeeCode: "", name: "", email: "", phone: "", position: "", department: "", joinDate: "", salary: 0, bankName: "", bankAccount: "" });
      fetchEmployees();
      toast("Employee added", "success");
    } catch (err: any) { toast(err.response?.data?.message || "Failed", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete employee?")) return;
    try { await api.delete(`/employees/${id}`); fetchEmployees(); toast("Employee deleted", "success"); }
    catch { toast("Failed", "error"); }
  };

  const columns = [
    { key: "employeeCode", label: "Code", render: (v: string) => <span className="font-medium">{v}</span> },
    { key: "name", label: "Name" },
    { key: "position", label: "Position" },
    { key: "department", label: "Department", render: (v: string) => v || "-" },
    { key: "salary", label: "Salary", align: "right" as const, render: (v: number) => `Rp ${v?.toLocaleString()}` },
    {
      key: "actions",
      label: "",
      align: "center" as const,
      render: (_: any, row: any) => (
        <Button variant="ghost" size="icon" onClick={() => handleDelete(row.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage staff & attendance"
        action={{ label: "Add Employee", onClick: () => setShowForm(!showForm) }}
        showForm={showForm}
        onRefresh={fetchEmployees}
      />

      {showForm && (
        <FormCard title="New Employee" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormGrid columns={2}>
              <FormField label="Code" required>
                <Input value={formData.employeeCode} onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })} required />
              </FormField>
              <FormField label="Name" required>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </FormField>
              <FormField label="Position" required>
                <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} required />
              </FormField>
              <FormField label="Department">
                <Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} list="departments" />
                <datalist id="departments">{departments.map(d => <option key={d} value={d} />)}</datalist>
              </FormField>
              <FormField label="Join Date" required>
                <Input type="date" value={formData.joinDate} onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })} required />
              </FormField>
              <FormField label="Salary">
                <Input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} />
              </FormField>
              <FormField label="Phone">
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormActions>
              <Button type="submit">Save Employee</Button>
            </FormActions>
          </form>
        </FormCard>
      )}

      <StatsGrid>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{employees.length}</div></CardContent>
        </Card>
      </StatsGrid>

      <FilterBar>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </FilterBar>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={employees}
          emptyMessage="No employees found."
        />
      )}
    </div>
  );
}