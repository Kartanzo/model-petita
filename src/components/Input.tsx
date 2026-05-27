import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

const fieldBase =
  'w-full h-12 rounded-xl border border-border bg-panel px-3 text-[16px] md:text-sm text-text placeholder:text-muted/60 focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15 outline-none transition';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, className, ...rest },
  ref,
) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">{label}</span>}
      <input ref={ref} className={cn(fieldBase, error && 'border-danger', className)} {...rest} />
      {error ? <span className="text-xs text-danger mt-1 block">{error}</span> : helper ? <span className="text-xs text-muted mt-1 block">{helper}</span> : null}
    </label>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> { label?: string; error?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, className, children, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">{label}</span>}
      <select ref={ref} className={cn(fieldBase, 'appearance-none pr-8', error && 'border-danger', className)} {...rest}>{children}</select>
      {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});

interface TAProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string; error?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TAProps>(function Textarea({ label, error, className, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">{label}</span>}
      <textarea ref={ref} className={cn(fieldBase, 'h-28 py-2', error && 'border-danger', className)} {...rest} />
      {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
    </label>
  );
});
