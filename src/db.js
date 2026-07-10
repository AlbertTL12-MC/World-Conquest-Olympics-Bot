const { Pool } = require('pg');

// Railway injects DATABASE_URL automatically when you attach the Postgres plugin.
// Railway's internal Postgres doesn't require SSL, but external connections do —
// this handles both without you needing to change anything.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway.internal')
    ? false
    : { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      captain_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      discord_id TEXT UNIQUE NOT NULL,
      team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
      goals INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      mvps INTEGER DEFAULT 0,
      matches_played INTEGER DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      team_home INTEGER REFERENCES teams(id),
      team_away INTEGER REFERENCES teams(id),
      score_home INTEGER DEFAULT 0,
      score_away INTEGER DEFAULT 0,
      scheduled_at TIMESTAMP,
      status TEXT DEFAULT 'scheduled', -- scheduled | live | finished
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Database schema ready');
}

module.exports = { pool, initDb };
