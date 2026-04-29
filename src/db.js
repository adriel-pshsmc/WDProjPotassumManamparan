const path = require('path');
const fs = require('fs');

// If DATABASE_URL is present, export a Postgres client setup; otherwise fall back to better-sqlite3
const DATABASE_URL = process.env.DATABASE_URL || null;

if (DATABASE_URL) {
	// Postgres mode
	const { Pool } = require('pg');

	// Normalize postgres:// -> postgresql:// for some clients (optional)
	let url = DATABASE_URL;
	if (url.startsWith('postgres://')) url = url.replace('postgres://', 'postgresql://');

	// Respect optional PG_SSLMODE
	const sslmode = process.env.PG_SSLMODE || process.env.PGSSLMODE || null;
	// serverless-friendly defaults: lower pool size when indicated
	const poolConfig = {
		connectionString: url,
		max: process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : (process.env.PG_SERVERLESS ? 2 : 10),
		idleTimeoutMillis: process.env.PG_IDLE_MS ? parseInt(process.env.PG_IDLE_MS, 10) : 30000
	};
	if (sslmode) {
		poolConfig.ssl = (sslmode === 'require' || sslmode === 'true') ? { rejectUnauthorized: false } : false;
	}

	const pool = new Pool(poolConfig);

	module.exports = { pg: { pool }, mode: 'pg' };
} else {
	// SQLite mode
	const Database = require('better-sqlite3');
	const DATA_DIR = path.join(__dirname, '..', 'data');
	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

	const DB_PATH = process.env.SQLITE_PATH || path.join(DATA_DIR, 'dev.db');
	const db = new Database(DB_PATH);
	module.exports = { db, DB_PATH, mode: 'sqlite' };
}
