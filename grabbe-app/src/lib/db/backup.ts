import { v4 as uuidv4 } from 'uuid';
import { getDb } from './connection';
import { upsertMedia } from './media';

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
        genres: m.genres ? JSON.parse(m.genres) : [],
        consumption_metric: m.consumption_metric,
        release_year: m.release_year,
        community_score: m.community_score,
        publisher_or_studio: m.publisher_or_studio,
        original_language: m.original_language,
        alternative_titles: m.alternative_titles ? JSON.parse(m.alternative_titles) : [],
        key_people: m.key_people ? JSON.parse(m.key_people) : [],
        total_progress_units: m.total_progress_units
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

/**
 * Resolves relational updates for a single item from backup data and performs
 * index-respecting inserts or updates across all SQLite tables.
 */
export async function importBackupItem(item: any) {
  const db = await getDb();
  const { media, tracking, ranking, sessions, history } = item;

  // 1. Resolve and Upsert Media structure cleanly
  const mediaToUpsert = {
      externalId: media.external_id,
      sourceApi: media.source_api,
      type: media.type,
      title: media.title,
      description: media.description,
      coverImageUrl: media.cover_image_path,
      releaseDate: media.release_date,
      formattedConsumptionMetric: media.consumption_metric,
      genres: media.genres || [],
      releaseYear: media.release_year || null,
      communityScore: media.community_score || null,
      publisherOrStudio: media.publisher_or_studio || null,
      originalLanguage: media.original_language || null,
      alternativeTitles: media.alternative_titles || [],
      keyPeople: media.key_people || [],
      totalProgressUnits: media.total_progress_units || null
  };
  const mediaId = await upsertMedia(mediaToUpsert);

  // 2. Resolve tracking record, respecting unique media associations
  const existingTrack = await db.select<any[]>(
      "SELECT id FROM UserTracking WHERE media_id = $1 LIMIT 1",
      [mediaId]
  );

  let trackingId: string;
  if (existingTrack && existingTrack.length > 0) {
      trackingId = existingTrack[0].id;
      await db.execute(
          "UPDATE UserTracking SET status = $1, progress = $2, total_progress = $3, rewatch_count = $4, review_text = $5, updated_at = $6 WHERE id = $7",
          [
              tracking.status,
              tracking.progress,
              tracking.total_progress,
              tracking.rewatch_count,
              tracking.review_text,
              tracking.updated_at || new Date().toISOString(),
              trackingId
          ]
      );
  } else {
      trackingId = uuidv4();
      await db.execute(
          "INSERT INTO UserTracking (id, media_id, status, progress, total_progress, rewatch_count, review_text, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [
              trackingId,
              mediaId,
              tracking.status,
              tracking.progress,
              tracking.total_progress,
              tracking.rewatch_count,
              tracking.review_text,
              tracking.updated_at || new Date().toISOString()
          ]
      );
  }

  // 3. Resolve and overwrite live Ranking evaluations
  if (ranking) {
      const existingRanking = await db.select<any[]>(
          "SELECT id FROM Ranking WHERE media_id = $1 LIMIT 1",
          [mediaId]
      );
      if (existingRanking && existingRanking.length > 0) {
          await db.execute(
              "UPDATE Ranking SET score = $1, review_text = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
              [ranking.score, ranking.review_text, existingRanking[0].id]
          );
      } else {
          await db.execute(
              "INSERT INTO Ranking (id, media_id, score, review_text) VALUES ($1, $2, $3, $4)",
              [uuidv4(), mediaId, ranking.score, ranking.review_text]
          );
      }
  }

  // 4. Overwrite historical Consumption Sessions safely
  await db.execute("DELETE FROM ConsumptionSession WHERE tracking_id = $1", [trackingId]);
  for (const session of sessions) {
      await db.execute(
          "INSERT INTO ConsumptionSession (id, tracking_id, session_number, start_date, finish_date, is_active) VALUES ($1, $2, $3, $4, $5, $6)",
          [
              uuidv4(),
              trackingId,
              session.session_number,
              session.start_date,
              session.finish_date,
              session.is_active
          ]
      );
  }

  // 5. Overwrite Tracking History entries safely
  await db.execute("DELETE FROM TrackingHistory WHERE tracking_id = $1", [trackingId]);
  for (const hist of history) {
      await db.execute(
          "INSERT INTO TrackingHistory (id, tracking_id, event_type, previous_value, new_value, event_date) VALUES ($1, $2, $3, $4, $5, $6)",
          [
              uuidv4(),
              trackingId,
              hist.event_type,
              hist.previous_value,
              hist.new_value,
              hist.event_date
          ]
      );
  }
}
