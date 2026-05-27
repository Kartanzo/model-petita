import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const CustomerSchema = z.object({
  type: z.enum(['PF', 'PJ']),
  name: z.string().min(1),
  trade_name: z.string().optional().nullable(),
  doc: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_district: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().length(2).optional().nullable().or(z.literal('')),
  address_zip: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  credit_limit: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

export const ProductSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  family_id: z.number().int().positive(),
  description: z.string().optional().nullable(),
  technical_specs: z.record(z.any()).optional(),
  cost: z.number().nonnegative(),
  price: z.number().nonnegative(),
  unit: z.string().optional(),
  photo_url: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const QuoteItemSchema = z.object({
  product_id: z.number().int().positive(),
  qty: z.number().positive(),
  list_price: z.number().nonnegative(),
  unit_price: z.number().nonnegative(),
  discount_pct: z.number().min(0).max(100).optional(),
});

export const QuoteSchema = z.object({
  customer_id: z.number().int().positive(),
  template_id: z.number().int().positive().optional().nullable(),
  status: z.enum(['rascunho', 'enviado', 'aprovado', 'rejeitado', 'convertido', 'expirado']).optional(),
  payment_terms: z.string().optional().nullable(),
  delivery_terms: z.string().optional().nullable(),
  valid_until: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(QuoteItemSchema).min(1),
});

export const OrderSchema = QuoteSchema.extend({
  status: z.enum(['aberto', 'aprovado', 'faturado', 'cancelado']).optional(),
  delivery_date: z.string().optional().nullable(),
});

export const FamilyRuleSchema = z.object({
  family_id: z.number().int().positive(),
  max_discount_pct: z.number().min(0).max(100),
  min_margin_pct: z.number().min(0).max(100),
  default_markup_pct: z.number().min(0),
  override_role: z.enum(['admin', 'superuser']).optional(),
});

export const TaxRuleSchema = z.object({
  name: z.string().min(1),
  tax_type: z.enum(['ICMS', 'PIS', 'COFINS', 'IPI', 'OUTRO']),
  rate: z.number().min(0).max(1),
  family_id: z.number().int().positive().optional().nullable(),
  state: z.string().length(2).optional().nullable(),
  applies_to: z.enum(['all', 'quote', 'order']).optional(),
});

export const TemplateSchema = z.object({
  scope: z.enum(['quote', 'order']),
  name: z.string().min(1),
  body: z.record(z.any()),
  is_default: z.boolean().optional(),
});

export const FamilySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  display_order: z.number().int().optional(),
});

export const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['user', 'admin', 'superuser']),
  active: z.boolean().optional(),
});
