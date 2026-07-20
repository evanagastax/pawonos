"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, X, RefreshCw } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  showForm?: boolean;
  onRefresh?: () => void;
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  showForm,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
        {action && (
          <Button size="sm" onClick={action.onClick}>
            {showForm ? (
              <>
                <X className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Cancel</span>
              </>
            ) : (
              <>
                {action.icon || <Plus className="h-4 w-4 md:mr-2" />}
                <span className="hidden md:inline">{action.label}</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 md:gap-4",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 md:grid-cols-3",
        columns === 4 && "grid-cols-2 md:grid-cols-4"
      )}
    >
      {children}
    </div>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center", className)}>
      {children}
    </div>
  );
}