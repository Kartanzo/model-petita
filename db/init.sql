-- =============================================================
-- Petita — schema + tabela de usuários + superuser inicial
-- =============================================================
-- Rodar uma vez no Postgres do EasyPanel (DB: criadordigital).
-- Connection string já em memória (reference_postgres_easypanel.md).
--
-- Como executar:
--   psql "postgres://postgres:l0i8t4orifwqr2a0k2ce@criadordigital_postgres-project:5432/criadordigital?sslmode=disable" -f init.sql
--   ou: cole tudo no SQL editor do EasyPanel / pgAdmin
-- =============================================================

CREATE SCHEMA IF NOT EXISTS petita;

SET search_path TO petita, public;

-- -------------------------------------------------------------
-- USERS
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS petita.users (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT,
  password    TEXT NOT NULL,                       -- hash bcrypt
  role        TEXT NOT NULL DEFAULT 'user',        -- user | admin | superuser
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT role_valid CHECK (role IN ('user','admin','superuser'))
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON petita.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON petita.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON petita.users(active);

-- trigger updated_at automático
CREATE OR REPLACE FUNCTION petita.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON petita.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON petita.users
FOR EACH ROW EXECUTE FUNCTION petita.touch_updated_at();

-- -------------------------------------------------------------
-- SUPERUSER seed
-- email:   petita@petita.com.br
-- senha:   Senha123!
-- bcrypt:  $2a$10$nKvHNqWFPhyK93ZIeanMEexnJxewHIvr177Gi7pP0pgCEE0PkNNxi
-- -------------------------------------------------------------
INSERT INTO petita.users (name, email, password, role, active)
VALUES (
  'Petita Admin',
  'petita@petita.com.br',
  '$2a$10$nKvHNqWFPhyK93ZIeanMEexnJxewHIvr177Gi7pP0pgCEE0PkNNxi',
  'superuser',
  TRUE
)
ON CONFLICT (email) DO UPDATE
   SET password = EXCLUDED.password,
       role     = EXCLUDED.role,
       active   = TRUE;

-- -------------------------------------------------------------
-- Conferir
-- -------------------------------------------------------------
SELECT id, name, email, role, active, created_at FROM petita.users;
