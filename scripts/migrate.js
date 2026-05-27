// Roda init.sql + full-schema.sql no boot (idempotente — ON CONFLICT / IF NOT EXISTS em tudo)
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[migrate] DATABASE_URL não definido");
  process.exit(1);
}

const FILES = [
  path.join(__dirname, "..", "db", "init.sql"),
  path.join(__dirname, "..", "db", "full-schema.sql"),
];

(async () => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    for (const f of FILES) {
      if (!fs.existsSync(f)) { console.log(`[migrate] skip (não existe): ${f}`); continue; }
      const sql = fs.readFileSync(f, "utf8");
      const start = Date.now();
      console.log(`[migrate] rodando ${path.basename(f)} (${(sql.length/1024).toFixed(1)} KB)…`);
      await client.query(sql);
      console.log(`[migrate]   ok em ${Date.now()-start}ms`);
    }
    const r = await client.query("SELECT COUNT(*)::int c FROM petita.users");
    console.log(`[migrate] users na base: ${r.rows[0].c}`);
    const r2 = await client.query("SELECT COUNT(*)::int c FROM petita.products");
    console.log(`[migrate] products na base: ${r2.rows[0].c}`);
    const r3 = await client.query("SELECT COUNT(*)::int c FROM petita.customers");
    console.log(`[migrate] customers na base: ${r3.rows[0].c}`);
  } catch (e) {
    console.error("[migrate] ERRO:", e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
