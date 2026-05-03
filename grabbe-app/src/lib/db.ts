import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidv4 } from 'uuid';

let dbInstance: Database | null = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:grabbe.db');
  }
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  
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
        notes TEXT,
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

  console.log("Database initialized and migrations ran successfully.");
}

// Media Add/Update
export async function upsertMedia(media: any) {
  const db = await getDb();
  const existingResult = await db.select<any[]>(
    "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1",
    [media.externalId, media.sourceApi]
  );
  
  let mediaId;
  if (existingResult && existingResult.length > 0) {
    mediaId = existingResult[0].id;
    // We could update it, but let's just keep the ID for now
  } else {
    mediaId = uuidv4();
    await db.execute(
      `INSERT INTO Media (id, external_id, source_api, type, title, description, cover_image_path, release_date, genres) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        mediaId, 
        media.externalId, 
        media.sourceApi, 
        media.type, 
        media.title, 
        media.description, 
        media.coverImageUrl, 
        media.releaseDate, 
        JSON.stringify(media.genres)
      ]
    );
  }
  return mediaId;
}

// Add/Update Tracking
export async function saveTracking(mediaId: string, status: string, score: number | null, progress: number, totalProgress: number | null, notes: string | null) {
  const db = await getDb();
  
  // Find tracking
  const trackResult = await db.select<any[]>("SELECT id FROM UserTracking WHERE media_id = $1 LIMIT 1", [mediaId]);
  
  let trackingId;
  if (trackResult && trackResult.length > 0) {
    trackingId = trackResult[0].id;
    await db.execute(
      "UPDATE UserTracking SET status = $1, progress = $2, total_progress = $3, notes = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5",
      [status, progress,totalProgress, notes, trackingId]
    );
  } else {
    trackingId = uuidv4();
    await db.execute(
      "INSERT INTO UserTracking (id, media_id, status, progress, total_progress, notes) VALUES ($1, $2, $3, $4, $5, $6)",
      [trackingId, mediaId, status, progress, totalProgress, notes]
    );
  }

  // Update Ranking
  if (score !== null && score > 0) {
    const rankResult = await db.select<any[]>("SELECT id FROM Ranking WHERE media_id = $1 LIMIT 1", [mediaId]);
    if (rankResult && rankResult.length > 0) {
      await db.execute(
        "UPDATE Ranking SET score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [score, rankResult[0].id]
      );
    } else {
      await db.execute(
        "INSERT INTO Ranking (id, media_id, score) VALUES ($1, $2, $3)",
        [uuidv4(), mediaId, score]
      );
    }
  }

  return trackingId;
}

// Get Library Items
export async function getLibraryItems() {
  const db = await getDb();
  return await db.select<any[]>(`
    SELECT m.*, ut.status, ut.progress, ut.total_progress, r.score 
    FROM Media m 
    INNER JOIN UserTracking ut ON m.id = ut.media_id
    LEFT JOIN Ranking r ON m.id = r.media_id
    ORDER BY ut.updated_at DESC
  `);
}

export async function getTrackingForMedia(mediaId: string) {
    const db = await getDb();
    const tracking = await db.select<any[]>("SELECT * FROM UserTracking WHERE media_id = $1 LIMIT 1", [mediaId]);
    const ranking = await db.select<any[]>("SELECT * FROM Ranking WHERE media_id = $1 LIMIT 1", [mediaId]);
    
    if (tracking && tracking.length > 0) {
        return {
            ...tracking[0],
            score: ranking && ranking.length > 0 ? ranking[0].score : null
        };
    }
    return null;
}

export async function getTrackingByExternalId(externalId: string, sourceApi: string) {
    const db = await getDb();
    const media = await db.select<any[]>("SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1", [externalId, sourceApi]);
    if (!media || media.length === 0) return null;
    return await getTrackingForMedia(media[0].id);
}

export async function removeTrackingByExternalId(externalId: string, sourceApi: string) {
    const db = await getDb();
    const media = await db.select<any[]>("SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1", [externalId, sourceApi]);
    if (!media || media.length === 0) return false;
    
    const mediaId = media[0].id;
    await db.execute("DELETE FROM Ranking WHERE media_id = $1", [mediaId]);
    
    // We must also delete ConsumptionSession and TrackingHistory associated with UserTracking
    const tracking = await db.select<any[]>("SELECT id FROM UserTracking WHERE media_id = $1", [mediaId]);
    for (const t of tracking) {
        await db.execute("DELETE FROM ConsumptionSession WHERE tracking_id = $1", [t.id]);
        await db.execute("DELETE FROM TrackingHistory WHERE tracking_id = $1", [t.id]);
    }

    await db.execute("DELETE FROM UserTracking WHERE media_id = $1", [mediaId]);
    // Optionally delete Media itself, but keeping it is fine as cache
    return true;
}
