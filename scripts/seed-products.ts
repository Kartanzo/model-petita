// Optional helper to (re)import products from produtos.json.
// Schema seeds already cover this. Use only if rerunning.
import { readFileSync } from 'fs';
import { join } from 'path';

const file = join(process.cwd(), 'produtos.json');
const items = JSON.parse(readFileSync(file, 'utf8'));
console.log('Found', items.length, 'products in produtos.json');
console.log('To seed, run db/full-schema.sql against your Postgres instance.');
