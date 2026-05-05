import Database from '@tauri-apps/plugin-sql';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Inserts a new media item or returns the existing one based on external API ID and source.
 * @param media The media object containing external IDs and metadata
 * @returns The internal UUID of the media
 */
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

/**
 * Saves or updates tracking progress for a media item.
 * 
 * Algorithm:
 * 1. Upserts the core `UserTracking` record.
 * 2. Manages `ConsumptionSession` by closing existing active sessions or opening new ones based on dates.
 * 3. Updates the `Ranking` table atomically if a score is provided.
 * 
 * @param mediaId The internal UUID of the media
 * @param status The current tracking status (e.g., CONSUMING, COMPLETED)
 * @param score Optional user score (1-10)
 * @param progress Current progress (episodes/pages/minutes)
 * @param totalProgress Total length of the media
 * @param notes Optional user review or notes
 * @param startDate Optional session start date
 * @param endDate Optional session end date
 * @returns The tracking ID
 */
export async function saveTracking(
  mediaId: string, 
  status: string, 
  score: number | null, 
  progress: number, 
  totalProgress: number | null, 
  notes: string | null,
  startDate?: string | null,
  endDate?: string | null
) {
  const db = await getDb();
  
  // Find tracking
  const trackResult = await db.select<any[]>("SELECT id FROM UserTracking WHERE media_id = $1 LIMIT 1", [mediaId]);
  
  let trackingId;
  if (trackResult && trackResult.length > 0) {
    trackingId = trackResult[0].id;
    await db.execute(
      "UPDATE UserTracking SET status = $1, progress = $2, total_progress = $3, notes = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5",
      [status, progress, totalProgress, notes, trackingId]
    );
  } else {
    trackingId = uuidv4();
    await db.execute(
      "INSERT INTO UserTracking (id, media_id, status, progress, total_progress, notes) VALUES ($1, $2, $3, $4, $5, $6)",
      [trackingId, mediaId, status, progress, totalProgress, notes]
    );
  }

  // Update/Insert ConsumptionSession
  if (startDate !== undefined || endDate !== undefined) {
    const sessionResult = await db.select<any[]>("SELECT id FROM ConsumptionSession WHERE tracking_id = $1 AND is_active = TRUE LIMIT 1", [trackingId]);
    if (sessionResult && sessionResult.length > 0) {
      await db.execute(
        "UPDATE ConsumptionSession SET start_date = $1, finish_date = $2 WHERE id = $3",
        [startDate || null, endDate || null, sessionResult[0].id]
      );
    } else if (startDate || endDate) {
      await db.execute(
        "INSERT INTO ConsumptionSession (id, tracking_id, start_date, finish_date, is_active) VALUES ($1, $2, $3, $4, TRUE)",
        [uuidv4(), trackingId, startDate || null, endDate || null]
      );
    }
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

/**
 * Retrieves all tracked library items across all statuses.
 * Includes join with Media, UserTracking, and Ranking tables.
 * 
 * @returns Array of library items sorted by latest update
 */
export async function getLibraryItems() {
  const db = await getDb();
  return await db.select<any[]>(`
    SELECT m.*, ut.status, ut.progress, ut.total_progress, ut.notes, r.score 
    FROM Media m 
    INNER JOIN UserTracking ut ON m.id = ut.media_id
    LEFT JOIN Ranking r ON m.id = r.media_id
    ORDER BY ut.updated_at DESC
  `);
}

/**
 * Gets the total number of tracked items in the user's library.
 */
export async function getMediaCount() {
    const db = await getDb();
    const result = await db.select<any[]>("SELECT COUNT(*) as count FROM UserTracking");
    return result[0]?.count || 0;
}

/**
 * Fetches the specific tracking record, ranking score, and active session dates for a given media ID.
 * 
 * @param mediaId The internal UUID of the media
 * @returns The combined tracking and session object, or null if not found
 */
export async function getTrackingForMedia(mediaId: string) {
    const db = await getDb();
    const tracking = await db.select<any[]>("SELECT * FROM UserTracking WHERE media_id = $1 LIMIT 1", [mediaId]);
    const ranking = await db.select<any[]>("SELECT * FROM Ranking WHERE media_id = $1 LIMIT 1", [mediaId]);
    
    if (tracking && tracking.length > 0) {
        const session = await db.select<any[]>("SELECT start_date, finish_date FROM ConsumptionSession WHERE tracking_id = $1 AND is_active = TRUE LIMIT 1", [tracking[0].id]);
        
        return {
            ...tracking[0],
            score: ranking && ranking.length > 0 ? ranking[0].score : null,
            startDate: session && session.length > 0 ? session[0].start_date : null,
            endDate: session && session.length > 0 ? session[0].finish_date : null
        };
    }
    return null;
}

/**
 * Looks up a tracking record using external API credentials.
 * 
 * @param externalId The ID from the source API
 * @param sourceApi The name of the API (e.g., 'TMDB', 'Jikan')
 * @returns The tracking object or null
 */
export async function getTrackingByExternalId(externalId: string, sourceApi: string) {
    const db = await getDb();
    const media = await db.select<any[]>("SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1", [externalId, sourceApi]);
    if (!media || media.length === 0) return null;
    return await getTrackingForMedia(media[0].id);
}

/**
 * Removes all tracking, sessions, and ranking data for a given external media item.
 * Leaves the cached Media record intact.
 * 
 * @param externalId The ID from the source API
 * @param sourceApi The name of the API
 * @returns True if deleted successfully, false otherwise
 */
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
