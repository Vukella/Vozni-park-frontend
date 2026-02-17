import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { SelectOption } from '../../types';

// ============================================
// Types
// ============================================

export type FieldType = 'text' | 'number' | 'select' | 'textarea' | 'date' | 'datetime' | 'checkbox' | 'password';

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  colSpan?: 1 | 2;
  helpText?: string;
}

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  title: string;
  fields: FormField[];
  initialData?: Record<string, unknown>;
  submitLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onFieldChange?: (key: string, value: unknown) => void;
}

// ============================================
// Component
// ============================================

export function FormModal({
                            open,
                            onClose,
                            onSubmit,
                            title,
                            fields,
                            initialData,
                            submitLabel = 'Save',
                            size = 'lg',
                            onFieldChange,
                          }: FormModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      const defaults: Record<string, unknown> = {};
      fields.forEach((field) => {
        if (initialData && initialData[field.key] !== undefined) {
          defaults[field.key] = initialData[field.key];
        } else if (field.type === 'checkbox') {
          defaults[field.key] = false;
        } else if (field.type === 'number') {
          defaults[field.key] = '';
        } else {
          defaults[field.key] = '';
        }
      });
      setFormData(defaults);
      setErrors({});
      setServerError('');
    }
  }, [open, initialData, fields]);

  function handleChange(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error when user types
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    // Notify parent of field change
    onFieldChange?.(key, value);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const val = formData[field.key];

      if (field.required) {
        if (val === '' || val === undefined || val === null) {
          newErrors[field.key] = `${field.label} is required.`;
          return;
        }
      }

      if (field.type === 'number' && val !== '' && val !== undefined) {
        const num = Number(val);
        if (isNaN(num)) {
          newErrors[field.key] = `${field.label} must be a number.`;
        } else if (field.min !== undefined && num < field.min) {
          newErrors[field.key] = `${field.label} must be at least ${field.min}.`;
        } else if (field.max !== undefined && num > field.max) {
          newErrors[field.key] = `${field.label} must be at most ${field.max}.`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      // Convert number fields to actual numbers
      const cleanData: Record<string, unknown> = {};
      fields.forEach((field) => {
        const val = formData[field.key];
        if (field.type === 'number' && val !== '' && val !== undefined) {
          cleanData[field.key] = Number(val);
        } else {
          cleanData[field.key] = val;
        }
      });

      await onSubmit(cleanData);
      onClose();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response: { data?: { message?: string } } }).response;
        setServerError(response.data?.message || 'Operation failed. Please try again.');
      } else {
        setServerError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
      <Modal
          open={open}
          onClose={onClose}
          title={title}
          size={size}
          footer={
            <>
              <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary" disabled={submitting}>
                {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
                {submitting ? 'Saving...' : submitLabel}
              </button>
            </>
          }
      >
        {serverError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {fields.map((field) => (
              <div key={field.key} className={field.colSpan === 2 ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
                {field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2">
                      <input
                          type="checkbox"
                          checked={Boolean(formData[field.key])}
                          onChange={(e) => handleChange(field.key, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={field.disabled || submitting}
                      />
                      <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    </label>
                ) : (
                    <>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="ml-0.5 text-red-500">*</span>}
                      </label>

                      {field.type === 'select' ? (
                          <select
                              value={String(formData[field.key] ?? '')}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              className={`input-field ${errors[field.key] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                              disabled={field.disabled || submitting}
                          >
                            <option value="">Select {field.label.toLowerCase()}...</option>
                            {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                            ))}
                          </select>
                      ) : field.type === 'textarea' ? (
                          <textarea
                              value={String(formData[field.key] ?? '')}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={3}
                              className={`input-field ${errors[field.key] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                              disabled={field.disabled || submitting}
                          />
                      ) : (
                          <input
                              type={field.type === 'datetime' ? 'datetime-local' : field.type}
                              value={String(formData[field.key] ?? '')}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              className={`input-field ${errors[field.key] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                              disabled={field.disabled || submitting}
                          />
                      )}
                    </>
                )}

                {field.helpText && !errors[field.key] && (
                    <p className="mt-1 text-xs text-gray-400">{field.helpText}</p>
                )}
                {errors[field.key] && (
                    <p className="mt-1 text-xs text-red-500">{errors[field.key]}</p>
                )}
              </div>
          ))}
        </form>
      </Modal>
  );
}
