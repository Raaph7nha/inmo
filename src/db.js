/**
 * HABITABOGOTÁ — /src/db.js
 * Pool de conexión a PostgreSQL (Neon) con SSL y gestión segura de sesiones.
 */

import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from './middleware/errorHandler.js';
import { memoryStore } from './services/memoryStore.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let schemaBootstrapPromise = null;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new AppError(
      'Base de datos no configurada en el servidor.',
      503,
      'DB_NOT_CONFIGURED'
    );
  }

  const needsSsl =
    connectionString.includes('sslmode=require') ||
    connectionString.includes('neon.tech') ||
    process.env.NODE_ENV === 'production';

  pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000
  });

  pool.on('error', (err) => {
    console.error('[DB Pool] Error inesperado en cliente inactivo:', err.code || 'UNKNOWN');
  });

  return pool;
}

async function ensureSchemaBootstrapped() {
  if (!isDatabaseConfigured()) return;
  if (schemaBootstrapPromise) return schemaBootstrapPromise;

  schemaBootstrapPromise = (async () => {
    const activePool = getPool();
    try {
      const check = await activePool.query("SELECT to_regclass('public.inmuebles') AS tbl");
      if (check.rows[0]?.tbl) return;

      const schemaPath = path.resolve(__dirname, '..', 'db', 'schema.sql');
      const seedPath = path.resolve(__dirname, '..', 'db', 'seed.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await activePool.query(schemaSql);
      }
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await activePool.query(seedSql);
      }
      console.log('[DB Bootstrap] Esquema y datos iniciales aplicados en PostgreSQL.');
    } catch (err) {
      schemaBootstrapPromise = null;
      console.error('[DB Bootstrap] No se pudo inicializar automáticamente:', err.code || err.message);
    }
  })();

  return schemaBootstrapPromise;
}

export async function query(text, params = []) {
  const activePool = getPool();
  await ensureSchemaBootstrapped();
  try {
    return await activePool.query(text, params);
  } catch (err) {
    if (err?.isOperational) throw err;
    console.error('[DB Query] Error SQL:', err.code || 'SQL_ERROR');
    throw new AppError(
      'No fue posible consultar la base de datos en este momento.',
      503,
      'DB_QUERY_FAILED'
    );
  }
}

export async function withTransaction(callback) {
  const activePool = getPool();
  await ensureSchemaBootstrapped();
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err?.isOperational) throw err;
    console.error('[DB Tx] Error en transacción:', err.code || 'TX_ERROR');
    throw new AppError(
      'Error al guardar los datos en la base de datos.',
      500,
      'DB_TX_FAILED'
    );
  } finally {
    client.release();
  }
}

export async function ensureSession(sesionId) {
  if (!isDatabaseConfigured()) {
    memoryStore.ensureSession(sesionId);
    return;
  }
  await query(
    'INSERT INTO sesiones (id) VALUES ($1) ON CONFLICT (id) DO NOTHING',
    [sesionId]
  );
}

export async function checkDbHealth() {
  if (!isDatabaseConfigured()) {
    return { ok: true, mode: 'memory' };
  }
  try {
    const res = await query('SELECT 1 AS alive, now() AS server_time');
    return { ok: true, mode: 'postgres', serverTime: res.rows[0]?.server_time };
  } catch {
    return { ok: false, mode: 'postgres', reason: 'DB_UNREACHABLE' };
  }
}
