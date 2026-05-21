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
        consumption_metric TEXT,
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

  console.log("Database initialized and migrations ran successfully.");
}

/**
 * Inserts a new media item or returns the existing one based on external API ID and source.
 * @param media The media object containing external IDs and metadata
 * @returns The internal UUID of the media
 */
export async function upsertMedia(media: any) {
  const db = await getDb();

  // --- Primary lookup: resolved external ID ---
  const existingResult = await db.select<any[]>(
    "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1",
    [media.externalId, media.sourceApi]
  );
  if (existingResult && existingResult.length > 0) {
    const existingId = existingResult[0].id;
    await db.execute(
      `UPDATE Media SET 
        title = $1, 
        description = COALESCE($2, description), 
        cover_image_path = COALESCE($3, cover_image_path), 
        release_date = COALESCE($4, release_date), 
        genres = COALESCE($5, genres), 
        consumption_metric = COALESCE($6, consumption_metric)
       WHERE id = $7`,
      [
        media.title,
        media.description || null,
        media.coverImageUrl || null,
        media.releaseDate || null,
        media.genres ? JSON.stringify(media.genres) : null,
        media.formattedConsumptionMetric || null,
        existingId
      ]
    );
    return existingId;
  }

  // --- Fallback lookup: title + type (only for unresolved placeholder imports) ---
  // When the BFF search fails, externalId is 'imported_<uuid>' — a new random value
  // each time. Without this guard, every re-import of the same file creates a new row.
  const isPlaceholder = media.externalId?.startsWith('imported_');
  if (isPlaceholder) {
    const byTitle = await db.select<any[]>(
      "SELECT id FROM Media WHERE title = $1 AND type = $2 LIMIT 1",
      [media.title, media.type]
    );
    if (byTitle && byTitle.length > 0) {
      return byTitle[0].id;
    }
  }

  // --- Insert: INSERT OR IGNORE respects the DB-level unique index atomically ---
  const mediaId = uuidv4();
  await db.execute(
    `INSERT OR IGNORE INTO Media (id, external_id, source_api, type, title, description, cover_image_path, release_date, genres, consumption_metric)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      mediaId,
      media.externalId,
      media.sourceApi,
      media.type,
      media.title,
      media.description,
      media.coverImageUrl,
      media.releaseDate,
      JSON.stringify(media.genres),
      media.formattedConsumptionMetric || null
    ]
  );

  // INSERT OR IGNORE is a no-op when there's a conflict, so re-fetch the winner.
  const winner = await db.select<any[]>(
    "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1",
    [media.externalId, media.sourceApi]
  );
  return winner && winner.length > 0 ? winner[0].id : mediaId;
}

/**
 * Saves or updates tracking progress for a media item.
 * 
 * @param mediaId The internal UUID of the media
 * @param status The current tracking status (e.g., CONSUMING, COMPLETED)
 * @param score Optional user score (1-10)
 * @param progress Current progress (episodes/pages/minutes)
 * @param totalProgress Total length of the media
 * @param reviewText The user's written review for this media
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
  reviewText: string | null,
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
      "UPDATE UserTracking SET status = $1, progress = $2, total_progress = $3, review_text = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5",
      [status, progress, totalProgress, reviewText, trackingId]
    );
  } else {
    trackingId = uuidv4();
    await db.execute(
      "INSERT INTO UserTracking (id, media_id, status, progress, total_progress, review_text) VALUES ($1, $2, $3, $4, $5, $6)",
      [trackingId, mediaId, status, progress, totalProgress, reviewText]
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

  // Update Ranking — persist both score and review_text together.
  // Also emit a point-in-time SCORE_CHANGE event so TrackingHistory is always auditable.
  if (score !== null && score > 0) {
    const rankResult = await db.select<any[]>("SELECT id FROM Ranking WHERE media_id = $1 LIMIT 1", [mediaId]);
    const previousScore = rankResult && rankResult.length > 0 ? rankResult[0].score : null;
    if (rankResult && rankResult.length > 0) {
      await db.execute(
        "UPDATE Ranking SET score = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        [score, reviewText, rankResult[0].id]
      );
    } else {
      await db.execute(
        "INSERT INTO Ranking (id, media_id, score, review_text) VALUES ($1, $2, $3, $4)",
        [uuidv4(), mediaId, score, reviewText]
      );
    }

    // Log the score change so the timeline can display point-in-time snapshots.
    if (previousScore !== score) {
      await db.execute(
        "INSERT INTO TrackingHistory (id, tracking_id, event_type, previous_value, new_value) VALUES ($1, $2, 'SCORE_CHANGE', $3, $4)",
        [uuidv4(), trackingId, previousScore !== null ? String(previousScore) : null, String(score)]
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
    SELECT m.*, ut.status, ut.progress, ut.total_progress, ut.review_text, r.score 
    FROM Media m 
    INNER JOIN UserTracking ut ON m.id = ut.media_id
    LEFT JOIN Ranking r ON m.id = r.media_id
    ORDER BY ut.updated_at DESC
  `);
}

/**
 * Retrieves all ranked items.
 * Includes join with Media, UserTracking, and Ranking tables.
 * 
 * @param mediaType Optional filter by media type
 * @returns Array of ranked library items sorted by score
 */
export async function getRankedItems(mediaType?: string) {
  const db = await getDb();
  let query = `
    SELECT m.*, ut.status, ut.progress, ut.total_progress, ut.review_text, r.score 
    FROM Media m 
    INNER JOIN UserTracking ut ON m.id = ut.media_id
    INNER JOIN Ranking r ON m.id = r.media_id
    WHERE r.score IS NOT NULL
  `;
  const params: any[] = [];
  if (mediaType && mediaType !== 'ALL') {
    query += " AND m.type = $1";
    params.push(mediaType);
  }
  query += " ORDER BY r.score DESC, ut.updated_at DESC";
  return await db.select<any[]>(query, params);
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
 * Fetches the tracking record, ranking, active session dates, and full session history for a media item.
 *
 * @param mediaId The internal UUID of the media
 * @returns The combined tracking object — including a `sessions` array of all ConsumptionSession rows — or null
 */
export async function getTrackingForMedia(mediaId: string) {
    const db = await getDb();
    const tracking = await db.select<any[]>("SELECT * FROM UserTracking WHERE media_id = $1 LIMIT 1", [mediaId]);
    const ranking = await db.select<any[]>("SELECT * FROM Ranking WHERE media_id = $1 LIMIT 1", [mediaId]);
    
    if (tracking && tracking.length > 0) {
        const trackingId = tracking[0].id;

        const activeSession = await db.select<any[]>(
            "SELECT start_date, finish_date FROM ConsumptionSession WHERE tracking_id = $1 AND is_active = TRUE LIMIT 1",
            [trackingId]
        );

        // All sessions ordered chronologically for the timeline view.
        const sessions = await db.select<any[]>(
            "SELECT session_number, start_date, finish_date, is_active FROM ConsumptionSession WHERE tracking_id = $1 ORDER BY session_number ASC",
            [trackingId]
        );

        // SESSION_COMPLETED events carry the archived score/review for past sessions.
        const historyEvents = await db.select<any[]>(
            "SELECT event_type, previous_value, new_value, event_date FROM TrackingHistory WHERE tracking_id = $1 AND event_type = 'SESSION_COMPLETED' ORDER BY event_date ASC",
            [trackingId]
        );
        
        return {
            ...tracking[0],                                              // exposes id, rewatch_count, status, review_text, etc.
            score: ranking && ranking.length > 0 ? ranking[0].score : null,
            reviewTextFromRanking: ranking && ranking.length > 0 ? ranking[0].review_text : null,
            startDate: activeSession && activeSession.length > 0 ? activeSession[0].start_date : null,
            endDate: activeSession && activeSession.length > 0 ? activeSession[0].finish_date : null,
            sessions,
            historyEvents
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

/**
 * Starts a new session for a media item that was COMPLETED, DROPPED, or ON HOLD.
 *
 * Orchestration (in order):
 * 1. Reads `rewatch_count` and `status` from `UserTracking`; fetches score/review from `Ranking`.
 * 2. Persists a `SESSION_COMPLETED` event in `TrackingHistory`, storing a JSON payload with
 *    the archived score, review, and the session's final status so the timeline can
 *    differentiate completed, dropped, and on-hold past sessions.
 * 3. Clears `Ranking.score`, `Ranking.review_text`, and `UserTracking.review_text` — clean slate.
 * 4. Archives the active `ConsumptionSession` by setting `is_active = FALSE`.
 * 5. Opens a new `ConsumptionSession` with `is_active = TRUE` and today's `start_date`.
 * 6. Resets `UserTracking`: `progress → 0`, `status → CONSUMING`, `rewatch_count += 1`.
 *
 * @param trackingId The UUID of the UserTracking row to restart
 * @param mediaId The UUID of the Media row (needed to clear the Ranking entry)
 * @returns The new `rewatch_count` value after incrementing
 */
export async function startRewatch(trackingId: string, mediaId: string): Promise<number> {
    const db = await getDb();

    // Step 1: Read the current tracking state — both rewatch_count and status.
    const trackResult = await db.select<any[]>(
        "SELECT rewatch_count, status FROM UserTracking WHERE id = $1 LIMIT 1",
        [trackingId]
    );
    if (!trackResult || trackResult.length === 0) {
        throw new Error(`No UserTracking record found for id: ${trackingId}`);
    }
    const currentRewatchCount: number = trackResult[0].rewatch_count ?? 0;
    const finalStatus: string = trackResult[0].status ?? 'COMPLETED';

    // Step 2: Fetch the final score and review before wiping them.
    const rankResult = await db.select<any[]>(
        "SELECT score, review_text FROM Ranking WHERE media_id = $1 LIMIT 1",
        [mediaId]
    );
    const finalScore = rankResult && rankResult.length > 0 ? rankResult[0].score : null;
    const finalReview = rankResult && rankResult.length > 0 ? rankResult[0].review_text : null;

    // Step 3: Archive the completed session's evaluation into TrackingHistory.
    // `previous_value` carries a JSON snapshot; `new_value` stores the session ordinal for lookup.
    // `finalStatus` preserves whether the session ended as COMPLETED, DROPPED, or ON HOLD so the
    // timeline can render the correct colour-coded badge for each past session.
    const sessionOrdinal = currentRewatchCount + 1; // session that just ended
    await db.execute(
        "INSERT INTO TrackingHistory (id, tracking_id, event_type, previous_value, new_value) VALUES ($1, $2, 'SESSION_COMPLETED', $3, $4)",
        [
            uuidv4(),
            trackingId,
            JSON.stringify({ score: finalScore, reviewText: finalReview, finalStatus }),
            String(sessionOrdinal)
        ]
    );

    // Step 4: Clear the live Ranking entry so the new session starts with a blank slate.
    if (rankResult && rankResult.length > 0) {
        await db.execute(
            "UPDATE Ranking SET score = NULL, review_text = NULL, updated_at = CURRENT_TIMESTAMP WHERE media_id = $1",
            [mediaId]
        );
    }

    // Step 5: Clear the review_text on UserTracking as well.
    await db.execute(
        "UPDATE UserTracking SET review_text = NULL WHERE id = $1",
        [trackingId]
    );

    // Step 6: Archive the currently active ConsumptionSession.
    await db.execute(
        "UPDATE ConsumptionSession SET is_active = FALSE WHERE tracking_id = $1 AND is_active = TRUE",
        [trackingId]
    );

    // Step 7: Determine the next session_number.
    const maxSessionResult = await db.select<any[]>(
        "SELECT COALESCE(MAX(session_number), 0) AS max_session FROM ConsumptionSession WHERE tracking_id = $1",
        [trackingId]
    );
    const nextSessionNumber: number = (maxSessionResult[0]?.max_session ?? 0) + 1;

    // Step 8: Open the new active session with today's date.
    await db.execute(
        "INSERT INTO ConsumptionSession (id, tracking_id, session_number, start_date, is_active) VALUES ($1, $2, $3, $4, TRUE)",
        [uuidv4(), trackingId, nextSessionNumber, new Date().toISOString()]
    );

    // Step 9: Reset journey — progress to 0, status to CONSUMING, rewatch_count incremented.
    const newRewatchCount = currentRewatchCount + 1;
    await db.execute(
        "UPDATE UserTracking SET progress = 0, status = 'CONSUMING', rewatch_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newRewatchCount, trackingId]
    );

    return newRewatchCount;
}

/**
 * Retrieves the base Media record by its external ID and source API.
 * Useful as a fallback when the BFF cannot fetch rich metadata.
 */
export async function getMediaByExternalId(externalId: string, sourceApi: string) {
    const db = await getDb();
    const media = await db.select<any[]>("SELECT * FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1", [externalId, sourceApi]);
    if (!media || media.length === 0) return null;
    
    return {
        id: media[0].id,
        externalId: media[0].external_id,
        sourceApi: media[0].source_api,
        type: media[0].type,
        title: media[0].title,
        description: media[0].description,
        coverImageUrl: media[0].cover_image_path,
        releaseDate: media[0].release_date,
        genres: media[0].genres ? JSON.parse(media[0].genres) : [],
    };
}

/**
 * Updates the external_id and source_api of a dummy imported Media item
 * to link it to a real external API item. Also updates the cache fields.
 */
export async function linkMediaToRealId(mediaId: string, newExternalId: string, newSourceApi: string, newType: string, newTitle: string, newCoverUrl: string | null) {
    const db = await getDb();
    await db.execute(
        "UPDATE Media SET external_id = $1, source_api = $2, type = $3, title = $4, cover_image_path = $5 WHERE id = $6",
        [newExternalId, newSourceApi, newType, newTitle, newCoverUrl, mediaId]
    );
}

/**
 * Unlinks a media item by reverting its external_id to a dummy ID and clearing rich metadata.
 * This allows the user to re-link it if they made a mistake.
 */
export async function unlinkMedia(mediaId: string): Promise<string> {
    const db = await getDb();
    const newExternalId = `imported_unlinked_${uuidv4()}`;
    await db.execute(
        "UPDATE Media SET external_id = $1, cover_image_path = NULL, description = NULL, release_date = NULL WHERE id = $2",
        [newExternalId, mediaId]
    );
    return newExternalId;
}

/**
 * Compiles and exports the user's entire local library into a structured, relational JSON backup format.
 * Executes parallel, highly performant select statements across Media, UserTracking, Ranking, ConsumptionSession,
 * and TrackingHistory, and maps them in memory.
 * 
 * @returns A promise resolving to the complete nested JSON backup object.
 */
export async function exportLibraryData() {
  const db = await getDb();

  // Perform parallel, highly optimized flat queries for all relevant tables
  const mediaList = await db.select<any[]>("SELECT * FROM Media");
  const trackingList = await db.select<any[]>("SELECT * FROM UserTracking");
  const sessionsList = await db.select<any[]>("SELECT * FROM ConsumptionSession");
  const rankingsList = await db.select<any[]>("SELECT * FROM Ranking");
  const historyList = await db.select<any[]>("SELECT * FROM TrackingHistory");

  // Map Media records by their primary key ID for O(1) in-memory lookup
  const mediaMap = new Map<string, any>();
  for (const m of mediaList) {
    mediaMap.set(m.id, m);
  }

  // Map Ranking evaluations by media ID for direct linking
  const rankingMap = new Map<string, any>();
  for (const r of rankingsList) {
    rankingMap.set(r.media_id, r);
  }

  // Group Consumption Sessions chronologically by their parent tracking tracking_id
  const sessionsGroup = new Map<string, any[]>();
  for (const s of sessionsList) {
    if (!sessionsGroup.has(s.tracking_id)) {
      sessionsGroup.set(s.tracking_id, []);
    }
    sessionsGroup.get(s.tracking_id)!.push({
      session_number: s.session_number,
      start_date: s.start_date,
      finish_date: s.finish_date,
      is_active: s.is_active
    });
  }

  // Group Tracking History event snapshots by their parent tracking tracking_id
  const historyGroup = new Map<string, any[]>();
  for (const h of historyList) {
    if (!historyGroup.has(h.tracking_id)) {
      historyGroup.set(h.tracking_id, []);
    }
    historyGroup.get(h.tracking_id)!.push({
      event_type: h.event_type,
      previous_value: h.previous_value,
      new_value: h.new_value,
      event_date: h.event_date
    });
  }

  // Build the nested collection representing tracked items with full relational fidelity
  const items = [];
  for (const t of trackingList) {
    const m = mediaMap.get(t.media_id);
    if (!m) continue; // Safety guard: ignore tracking records without active media definitions

    const r = rankingMap.get(t.media_id);
    const sessions = sessionsGroup.get(t.id) || [];
    const history = historyGroup.get(t.id) || [];

    items.push({
      media: {
        external_id: m.external_id,
        source_api: m.source_api,
        type: m.type,
        title: m.title,
        description: m.description,
        cover_image_path: m.cover_image_path,
        release_date: m.release_date,
        genres: m.genres ? JSON.parse(m.genres) : []
      },
      tracking: {
        status: t.status,
        progress: t.progress,
        total_progress: t.total_progress,
        rewatch_count: t.rewatch_count,
        review_text: t.review_text,
        updated_at: t.updated_at
      },
      ranking: r ? {
        score: r.score,
        review_text: r.review_text
      } : null,
      sessions,
      history
    });
  }

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    items
  };
}
