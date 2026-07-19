"use client";

import { useState, useCallback } from "react";

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

interface ValidationErrors {
  [field: string]: string;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Record<keyof T, ValidationRule>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (name: string, value: any): string | null => {
      const rule = rules[name as keyof T];
      if (!rule) return null;

      if (rule.required && (!value || value === "")) {
        return `${name} is required`;
      }

      if (rule.minLength && typeof value === "string" && value.length < rule.minLength) {
        return `${name} must be at least ${rule.minLength} characters`;
      }

      if (rule.maxLength && typeof value === "string" && value.length > rule.maxLength) {
        return `${name} must be at most ${rule.maxLength} characters`;
      }

      if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
        return `${name} must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && typeof value === "number" && value > rule.max) {
        return `${name} must be at most ${rule.max}`;
      }

      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        return `${name} format is invalid`;
      }

      if (rule.custom) {
        return rule.custom(value);
      }

      return null;
    },
    [rules]
  );

  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    for (const name in rules) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [values, rules, validateField]);

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error || "",
        }));
      }
    },
    [touched, validateField]
  );

  const setFieldTouched = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, values[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: error || "",
      }));
    },
    [values, validateField]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}