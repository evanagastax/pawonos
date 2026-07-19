"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Users,
  Package,
  BookOpen,
  UtensilsCrossed,
  ClipboardList,
  Warehouse,
  Truck,
  DollarSign,
  Settings,
  Target,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Meal Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Customers",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    name: "Suppliers",
    href: "/dashboard/suppliers",
    icon: Truck,
  },
  {
    name: "Ingredients",
    href: "/dashboard/ingredients",
    icon: Package,
  },
  {
    name: "Recipes",
    href: "/dashboard/recipes",
    icon: BookOpen,
  },
  {
    name: "Menu Items",
    href: "/dashboard/menu-items",
    icon: UtensilsCrossed,
  },
  {
    name: "Meal Templates",
    href: "/dashboard/meal-templates",
    icon: ClipboardList,
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Warehouse,
  },
  {
    name: "Purchasing",
    href: "/dashboard/purchasing",
    icon: ShoppingCart,
  },
  {
    name: "Production",
    href: "/dashboard/production",
    icon: Settings,
  },
  {
    name: "Optimizer",
    href: "/dashboard/optimizer",
    icon: Target,
  },
  {
    name: "Delivery",
    href: "/dashboard/delivery",
    icon: Truck,
  },
  {
    name: "Finance",
    href: "/dashboard/finance",
    icon: DollarSign,
  },
  {
    name: "Invoices",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    name: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    name: "Payroll",
    href: "/dashboard/payroll",
    icon: DollarSign,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">PawonOS</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 hover:bg-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-muted-foreground">admin@pawonos.com</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}