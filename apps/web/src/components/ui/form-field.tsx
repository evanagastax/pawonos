"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: any;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string) => void;
  className?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  error,
  touched,
  placeholder,
  required,
  onChange,
  onBlur,
  className,
}: FormFieldProps) {
  const showError = touched && error;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <Input
        id={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(name, type === "number" ? Number(e.target.value) : e.target.value)
        }
        onBlur={() => onBlur?.(name)}
        className={cn(showError && "border-destructive")}
      />
      {showError && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface FormSelectProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  touched?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  className?: string;
}

export function FormSelect({
  label,
  name,
  value,
  error,
  touched,
  options,
  placeholder,
  required,
  onChange,
  onBlur,
  className,
}: FormSelectProps) {
  const showError = touched && error;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <select
        id={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur?.(name)}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          showError && "border-destructive"
        )}
      >
        <option value="">{placeholder || "Select..."}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {showError && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}