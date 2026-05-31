-- Migration 001: Initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Operarios (workers) table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT NOT NULL,
  plataforma    TEXT NOT NULL,
  pin_hash      TEXT NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bultos (packages) table
CREATE TABLE IF NOT EXISTS bultos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_barras   TEXT NOT NULL,
  alto_cm         NUMERIC,
  ancho_cm        NUMERIC,
  largo_cm        NUMERIC,
  volumen_m3      NUMERIC,
  peso_kg         NUMERIC,
  user_id         UUID REFERENCES users(id),
  plataforma      TEXT NOT NULL,
  fecha_hora_utc  TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient barcode + date lookups
CREATE INDEX IF NOT EXISTS idx_bultos_codigo_fecha
  ON bultos (codigo_barras, fecha_hora_utc);

CREATE INDEX IF NOT EXISTS idx_bultos_fecha
  ON bultos (fecha_hora_utc);
