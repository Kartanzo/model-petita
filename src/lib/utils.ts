import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const fmtBRL = (n: number | string | null | undefined): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n ?? 0;
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const fmtDate = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('pt-BR');
};

export const fmtPct = (n: number | string | null | undefined, digits = 1): string => {
  const v = typeof n === 'string' ? parseFloat(n) : n ?? 0;
  return `${(v ?? 0).toFixed(digits)}%`;
};
