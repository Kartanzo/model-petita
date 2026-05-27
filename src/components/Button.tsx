import { cn } from '@/lib/utils';
import { forwardRef, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantCls: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-brand-700 to-brand-500 text-white hover:from-brand-900 hover:to-brand-700 shadow-soft',
  secondary: 'bg-panel text-brand-700 border border-border hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-danger text-white hover:bg-red-700',
};

const sizeCls: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-4 text-[15px]',
  lg: 'h-14 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="animate-pulse">…</span> : children}
    </button>
  );
});
