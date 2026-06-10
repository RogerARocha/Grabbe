import Database from '@tauri-apps/plugin-sql';

let dbInstance: Database | null = null;

/**
 * Retrieves the singleton instance of the Tauri SQLite database.
 * @returns The Database instance
 */
export async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:grabbe.db');
  }
  return dbInstance;
}

/**
 * Initializes the database schema and runs necessary migrations.
 * Creates tables for Media, UserTracking, ConsumptionSession, TrackingHistory, and Ranking.
 */
export async function initDb() {
  const db = await getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS AppSettings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Media (
        id TEXT PRIMARY KEY,
        external_id TEXT NOT NULL,
        source_api TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cover_image_path TEXT,
        release_date DATE,
        franchise TEXT,
        genres TEXT,
        consumption_metric TEXT,
        release_year TEXT,
        community_score REAL,
        publisher_or_studio TEXT,
        original_language TEXT,
        alternative_titles TEXT,
        key_people TEXT,
        total_progress_units INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS UserTracking (
        id TEXT PRIMARY KEY,
        media_id TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        total_progress INTEGER,
        rewatch_count INTEGER DEFAULT 0,
        review_text TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (media_id) REFERENCES Media(id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ConsumptionSession (
        id TEXT PRIMARY KEY,
        tracking_id TEXT NOT NULL,
        session_number INTEGER DEFAULT 1,
        start_date DATETIME,
        finish_date DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tracking_id) REFERENCES UserTracking(id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS TrackingHistory (
        id TEXT PRIMARY KEY,
        tracking_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        previous_value TEXT,
        new_value TEXT,
        event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tracking_id) REFERENCES UserTracking(id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Ranking (
        id TEXT PRIMARY KEY,
        media_id TEXT NOT NULL UNIQUE,
        score INTEGER CHECK (score >= 1 AND score <= 10),
        review_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (media_id) REFERENCES Media(id)
    );
  `);

  // Enforce uniqueness at the DB level so concurrent upsert calls and
  // re-imports can never produce duplicate (external_id, source_api) pairs.
  // IF NOT EXISTS makes this idempotent across app restarts.
  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_media_external_source
      ON Media(external_id, source_api);
  `);

  // Migration for adding consumption_metric to existing databases
  try {
    await db.execute("ALTER TABLE Media ADD COLUMN consumption_metric TEXT;");
    console.log("Migration: Added consumption_metric column to Media table.");
  } catch (e) {
    // Column already exists, ignore
  }

  // Migrations for local-first rich metadata caching
  const newColumns = [
    { name: "release_year", type: "TEXT" },
    { name: "community_score", type: "REAL" },
    { name: "publisher_or_studio", type: "TEXT" },
    { name: "original_language", type: "TEXT" },
    { name: "alternative_titles", type: "TEXT" },
    { name: "key_people", type: "TEXT" },
    { name: "total_progress_units", type: "INTEGER" }
  ];

  for (const col of newColumns) {
    try {
      await db.execute(`ALTER TABLE Media ADD COLUMN ${col.name} ${col.type};`);
      console.log(`Migration: Added ${col.name} column to Media table.`);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  console.log("Database initialized and migrations ran successfully.");
}
