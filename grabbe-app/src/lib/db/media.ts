import { v4 as uuidv4 } from 'uuid';
import { getDb } from './connection';

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
        consumption_metric = COALESCE($6, consumption_metric),
        release_year = COALESCE($7, release_year),
        community_score = COALESCE($8, community_score),
        publisher_or_studio = COALESCE($9, publisher_or_studio),
        original_language = COALESCE($10, original_language),
        alternative_titles = COALESCE($11, alternative_titles),
        key_people = COALESCE($12, key_people),
        total_progress_units = COALESCE($13, total_progress_units)
       WHERE id = $14`,
      [
        media.title,
        media.description || null,
        media.coverImageUrl || null,
        media.releaseDate || null,
        media.genres ? JSON.stringify(media.genres) : null,
        media.formattedConsumptionMetric || null,
        media.releaseYear || (media.releaseDate ? String(media.releaseDate).split('-')[0] : null) || null,
        media.communityScore !== undefined && media.communityScore !== null ? media.communityScore : null,
        media.publisherOrStudio || null,
        media.originalLanguage || null,
        media.alternativeTitles ? JSON.stringify(media.alternativeTitles) : null,
        media.keyPeople ? JSON.stringify(media.keyPeople) : null,
        media.totalProgressUnits !== undefined && media.totalProgressUnits !== null ? media.totalProgressUnits : null,
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
    `INSERT OR IGNORE INTO Media (id, external_id, source_api, type, title, description, cover_image_path, release_date, genres, consumption_metric, release_year, community_score, publisher_or_studio, original_language, alternative_titles, key_people, total_progress_units)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
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
      media.formattedConsumptionMetric || null,
      media.releaseYear || (media.releaseDate ? String(media.releaseDate).split('-')[0] : null) || null,
      media.communityScore !== undefined && media.communityScore !== null ? media.communityScore : null,
      media.publisherOrStudio || null,
      media.originalLanguage || null,
      media.alternativeTitles ? JSON.stringify(media.alternativeTitles) : null,
      media.keyPeople ? JSON.stringify(media.keyPeople) : null,
      media.totalProgressUnits !== undefined && media.totalProgressUnits !== null ? media.totalProgressUnits : null
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
        releaseYear: media[0].release_year,
        genres: media[0].genres ? JSON.parse(media[0].genres) : [],
        communityScore: media[0].community_score,
        publisherOrStudio: media[0].publisher_or_studio,
        originalLanguage: media[0].original_language,
        formattedConsumptionMetric: media[0].consumption_metric,
        totalProgressUnits: media[0].total_progress_units,
        alternativeTitles: media[0].alternative_titles ? JSON.parse(media[0].alternative_titles) : [],
        keyPeople: media[0].key_people ? JSON.parse(media[0].key_people) : []
    };
}

/**
 * Updates the external_id and source_api of a dummy imported Media item
 * to link it to a real external API item. Also updates the cache fields.
 */
export async function linkMediaToRealId(mediaId: string, newExternalId: string, newSourceApi: string, newType: string, newTitle: string, newCoverUrl: string | null) {
    const db = await getDb();

    // Check if another Media row already has the new external_id and source_api
    const existing = await db.select<any[]>(
        "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1",
        [newExternalId, newSourceApi]
    );

    if (existing && existing.length > 0) {
        const realMediaId = existing[0].id;

        // 1. Handle UserTracking unique/duplicate constraint
        const trackingExists = await db.select<any[]>(
            "SELECT id FROM UserTracking WHERE media_id = $1 LIMIT 1",
            [realMediaId]
        );
        if (trackingExists && trackingExists.length > 0) {
            const oldTrackingId = trackingExists[0].id;
            await db.execute("DELETE FROM ConsumptionSession WHERE tracking_id = $1", [oldTrackingId]);
            await db.execute("DELETE FROM TrackingHistory WHERE tracking_id = $1", [oldTrackingId]);
            await db.execute("DELETE FROM UserTracking WHERE id = $1", [oldTrackingId]);
        }

        // 2. Handle Ranking unique constraint
        await db.execute("DELETE FROM Ranking WHERE media_id = $1", [realMediaId]);

        // 3. Re-link current tracking & ranking to point to the existing real media record
        await db.execute("UPDATE UserTracking SET media_id = $1 WHERE media_id = $2", [realMediaId, mediaId]);
        await db.execute("UPDATE Ranking SET media_id = $1 WHERE media_id = $2", [realMediaId, mediaId]);

        // 4. Delete the dummy media row from cache since it's no longer referenced
        await db.execute("DELETE FROM Media WHERE id = $1", [mediaId]);
    } else {
        // Safe to update the dummy media row in place
        await db.execute(
            "UPDATE Media SET external_id = $1, source_api = $2, type = $3, title = $4, cover_image_path = $5 WHERE id = $6",
            [newExternalId, newSourceApi, newType, newTitle, newCoverUrl, mediaId]
        );
    }
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
