import type { PoolClient } from 'pg';
import { pool } from './db';

const LOCK_KEYS = { quote: 1001, order: 1002 } as const;

export async function nextNumber(scope: 'quote' | 'order', client?: PoolClient): Promise<string> {
  const c = client ?? (await pool.connect());
  const ownClient = !client;
  try {
    await c.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEYS[scope]]);
    const { rows: cfgRows } = await c.query<{ value: any }>(
      `SELECT value FROM petita.config WHERE key='numbering'`,
    );
    const cfg = cfgRows[0]?.value ?? { quote_prefix: 'ORC', order_prefix: 'PED', year: new Date().getFullYear() };
    const prefix = scope === 'quote' ? cfg.quote_prefix : cfg.order_prefix;
    const year = cfg.year ?? new Date().getFullYear();
    const table = scope === 'quote' ? 'quotes' : 'orders';
    const pattern = `${prefix}-${year}-%`;
    const { rows } = await c.query<{ max: string | null }>(
      `SELECT MAX(number) AS max FROM petita.${table} WHERE number LIKE $1`,
      [pattern],
    );
    let n = 1;
    if (rows[0]?.max) {
      const m = rows[0].max.match(/-(\d+)$/);
      if (m) n = parseInt(m[1], 10) + 1;
    }
    return `${prefix}-${year}-${String(n).padStart(5, '0')}`;
  } finally {
    if (ownClient) c.release();
  }
}
