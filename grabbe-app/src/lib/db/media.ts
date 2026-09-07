import { v4 as uuidv4 } from 'uuid';
import Database from '@tauri-apps/plugin-sql';
import { getDb } from './connection';

/**
 * Updates metadata columns on an existing Media row without modifying external_id or source_api.
 */
async function updateMediaMetadata(db: Database, existingId: string, media: any) {
  const genresStr = Array.isArray(media.genres) ? JSON.stringify(media.genres) : (media.genres || null);
  const altTitlesStr = Array.isArray(media.alternativeTitles) ? JSON.stringify(media.alternativeTitles) : (media.alternativeTitles || null);
  const keyPeopleStr = Array.isArray(media.keyPeople) ? JSON.stringify(media.keyPeople) : (media.keyPeople || null);

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
      genresStr,
      media.formattedConsumptionMetric || null,
      media.releaseYear || (media.releaseDate ? String(media.releaseDate).split('-')[0] : null) || null,
      media.communityScore !== undefined && media.communityScore !== null ? media.communityScore : null,
      media.publisherOrStudio || null,
      media.originalLanguage || null,
      altTitlesStr,
      keyPeopleStr,
      media.totalProgressUnits !== undefined && media.totalProgressUnits !== null ? media.totalProgressUnits : null,
      existingId
    ]
  );
}

/**
 * Updates an existing Media row in-place, modifying its external_id, source_api, type, and all metadata.
 */
async function updateMediaInPlace(db: Database, existingId: string, media: any) {
  const genresStr = Array.isArray(media.genres) ? JSON.stringify(media.genres) : (media.genres || null);
  const altTitlesStr = Array.isArray(media.alternativeTitles) ? JSON.stringify(media.alternativeTitles) : (media.alternativeTitles || null);
  const keyPeopleStr = Array.isArray(media.keyPeople) ? JSON.stringify(media.keyPeople) : (media.keyPeople || null);

  await db.execute(
    `UPDATE Media SET 
      external_id = $1,
      source_api = $2,
      type = $3,
      title = $4, 
      description = COALESCE($5, description), 
      cover_image_path = COALESCE($6, cover_image_path), 
      release_date = COALESCE($7, release_date), 
      genres = COALESCE($8, genres), 
      consumption_metric = COALESCE($9, consumption_metric),
      release_year = COALESCE($10, release_year),
      community_score = COALESCE($11, community_score),
      publisher_or_studio = COALESCE($12, publisher_or_studio),
      original_language = COALESCE($13, original_language),
      alternative_titles = COALESCE($14, alternative_titles),
      key_people = COALESCE($15, key_people),
      total_progress_units = COALESCE($16, total_progress_units)
     WHERE id = $17`,
    [
      media.externalId,
      media.sourceApi,
      media.type,
      media.title,
      media.description || null,
      media.coverImageUrl || null,
      media.releaseDate || null,
      genresStr,
      media.formattedConsumptionMetric || null,
      media.releaseYear || (media.releaseDate ? String(media.releaseDate).split('-')[0] : null) || null,
      media.communityScore !== undefined && media.communityScore !== null ? media.communityScore : null,
      media.publisherOrStudio || null,
      media.originalLanguage || null,
      altTitlesStr,
      keyPeopleStr,
      media.totalProgressUnits !== undefined && media.totalProgressUnits !== null ? media.totalProgressUnits : null,
      existingId
    ]
  );
}

/**
 * Registry of canonical target providers and their legacy/deprecated counterpart source APIs.
 * This makes provider migrations future-proof: whenever a provider transition occurs,
 * simply register the mapping here (and in BFF ProviderAliases) without modifying UI components.
 */
export const PROVIDER_MIGRATION_RULES: Record<string, string[]> = {
  ANILIST: ['JIKAN', 'MAL'],
  // Extensible for future provider migrations:
  // TVDB: ['TMDB'],
  // GOOGLEBOOKS: ['OPENLIBRARY'],
};

/**
 * Returns true if the given sourceApi is a known legacy provider for any active target provider.
 */
export function isKnownLegacyProvider(sourceApi: string | null | undefined): boolean {
  if (!sourceApi) return false;
  const upper = sourceApi.toUpperCase();
  return Object.values(PROVIDER_MIGRATION_RULES).some(list => list.includes(upper));
}

/**
 * Inserts a new media item or returns/updates the existing one based on external API ID and source.
 * Supports seamless in-place migration for legacy provider records when enriched with canonical provider data.
 * 
 * @param media The media object containing external IDs and metadata
 * @returns The internal UUID of the media
 */
export async function upsertMedia(media: any) {
  const db = await getDb();

  // --- 1. Primary lookup: resolved external ID + source API ---
  const existingResult = await db.select<any[]>(
    "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 LIMIT 1",
    [media.externalId, media.sourceApi]
  );
  if (existingResult && existingResult.length > 0) {
    const existingId = existingResult[0].id;
    await updateMediaMetadata(db, existingId, media);
    return existingId;
  }

  // --- 2. Secondary lookup by media.id: In-place migration if an existing DB record ID is provided ---
  // (e.g. MediaDetails viewing a legacy provider item and enriching it with canonical provider data, or saving an edited item)
  if (media.id) {
    const existingById = await db.select<any[]>(
      "SELECT id, source_api, external_id FROM Media WHERE id = $1 LIMIT 1",
      [media.id]
    );
    if (existingById && existingById.length > 0) {
      // Check if another Media row already has the new (externalId, sourceApi)
      const conflict = await db.select<any[]>(
        "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 AND id != $3 LIMIT 1",
        [media.externalId, media.sourceApi, media.id]
      );
      if (conflict && conflict.length > 0) {
        await mergeMediaRecords(db, conflict[0].id, media.id);
        await updateMediaMetadata(db, conflict[0].id, media);
        return conflict[0].id;
      }

      // Safe to update in-place (upgrading source_api e.g. from JIKAN to ANILIST)
      await updateMediaInPlace(db, media.id, media);
      return media.id;
    }
  }

  // --- 3. Tertiary lookup: Title + Type matching for legacy provider records being upgraded ---
  const legacySources = PROVIDER_MIGRATION_RULES[media.sourceApi?.toUpperCase()] || [];
  if (legacySources.length > 0 && media.title) {
    for (const legacySource of legacySources) {
      const legacyMatch = await db.select<any[]>(
        "SELECT id FROM Media WHERE source_api = $1 AND (LOWER(TRIM(title)) = LOWER(TRIM($2)) OR alternative_titles LIKE $3) LIMIT 1",
        [legacySource, media.title, `%${media.title}%`]
      );
      if (legacyMatch && legacyMatch.length > 0) {
        const legacyId = legacyMatch[0].id;
        await updateMediaInPlace(db, legacyId, media);
        return legacyId;
      }
    }
  }

  // --- 4. Fallback lookup: title + type (only for unresolved placeholder imports) ---
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

  // --- 5. Insert: INSERT OR IGNORE respects the DB-level unique index atomically ---
  const mediaId = media.id || uuidv4();
  const genresStr = Array.isArray(media.genres) ? JSON.stringify(media.genres) : (media.genres || null);
  const altTitlesStr = Array.isArray(media.alternativeTitles) ? JSON.stringify(media.alternativeTitles) : (media.alternativeTitles || null);
  const keyPeopleStr = Array.isArray(media.keyPeople) ? JSON.stringify(media.keyPeople) : (media.keyPeople || null);

  await db.execute(
    `INSERT OR IGNORE INTO Media (id, external_id, source_api, type, title, description, cover_image_path, release_date, genres, consumption_metric, release_year, community_score, publisher_or_studio, original_language, alternative_titles, key_people, total_progress_units)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      mediaId,
      media.externalId,
      media.sourceApi,
      media.type,
      media.title,
      media.description || null,
      media.coverImageUrl || null,
      media.releaseDate || null,
      genresStr,
      media.formattedConsumptionMetric || null,
      media.releaseYear || (media.releaseDate ? String(media.releaseDate).split('-')[0] : null) || null,
      media.communityScore !== undefined && media.communityScore !== null ? media.communityScore : null,
      media.publisherOrStudio || null,
      media.originalLanguage || null,
      altTitlesStr,
      keyPeopleStr,
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
 * Merges two Media records in SQLite, cleanly re-pointing UserTracking, Ranking,
 * ConsumptionSession, and TrackingHistory from sourceMediaId to targetMediaId,
 * then deleting sourceMediaId.
 */
export async function mergeMediaRecords(db: Database, targetMediaId: string, sourceMediaId: string) {
    if (targetMediaId === sourceMediaId) return;

    // 1. Resolve UserTracking for both records
    const targetTracks = await db.select<any[]>(
        "SELECT * FROM UserTracking WHERE media_id = $1 LIMIT 1",
        [targetMediaId]
    );
    const sourceTracks = await db.select<any[]>(
        "SELECT * FROM UserTracking WHERE media_id = $1 LIMIT 1",
        [sourceMediaId]
    );

    const targetTrack = targetTracks && targetTracks.length > 0 ? targetTracks[0] : null;
    const sourceTrack = sourceTracks && sourceTracks.length > 0 ? sourceTracks[0] : null;

    if (targetTrack && sourceTrack) {
        // Decide winner tracking record: prefer the one with progress or latest update
        const targetHasProgress = (targetTrack.progress || 0) > 0 || targetTrack.status === 'COMPLETED';
        const sourceHasProgress = (sourceTrack.progress || 0) > 0 || sourceTrack.status === 'COMPLETED';

        let winnerTrack = targetTrack;
        let loserTrack = sourceTrack;

        if (!targetHasProgress && sourceHasProgress) {
            winnerTrack = sourceTrack;
            loserTrack = targetTrack;
        } else if (sourceTrack.updated_at && targetTrack.updated_at) {
            if (new Date(sourceTrack.updated_at) > new Date(targetTrack.updated_at) && sourceHasProgress) {
                winnerTrack = sourceTrack;
                loserTrack = targetTrack;
            }
        }

        // Move sessions and history from loser tracking to winner tracking
        await db.execute(
            "UPDATE ConsumptionSession SET tracking_id = $1 WHERE tracking_id = $2",
            [winnerTrack.id, loserTrack.id]
        );
        await db.execute(
            "UPDATE TrackingHistory SET tracking_id = $1 WHERE tracking_id = $2",
            [winnerTrack.id, loserTrack.id]
        );

        // Delete loser tracking
        await db.execute("DELETE FROM UserTracking WHERE id = $1", [loserTrack.id]);

        // Ensure winner tracking points to targetMediaId
        await db.execute(
            "UPDATE UserTracking SET media_id = $1 WHERE id = $2",
            [targetMediaId, winnerTrack.id]
        );
    } else if (!targetTrack && sourceTrack) {
        // Re-point source tracking to target media
        await db.execute(
            "UPDATE UserTracking SET media_id = $1 WHERE id = $2",
            [targetMediaId, sourceTrack.id]
        );
    }

    // 2. Resolve Ranking for both records
    const targetRanks = await db.select<any[]>(
        "SELECT * FROM Ranking WHERE media_id = $1 LIMIT 1",
        [targetMediaId]
    );
    const sourceRanks = await db.select<any[]>(
        "SELECT * FROM Ranking WHERE media_id = $1 LIMIT 1",
        [sourceMediaId]
    );

    const targetRank = targetRanks && targetRanks.length > 0 ? targetRanks[0] : null;
    const sourceRank = sourceRanks && sourceRanks.length > 0 ? sourceRanks[0] : null;

    if (targetRank && sourceRank) {
        if (!targetRank.score && sourceRank.score) {
            await db.execute(
                "UPDATE Ranking SET score = $1, review_text = COALESCE($2, review_text) WHERE id = $3",
                [sourceRank.score, sourceRank.review_text, targetRank.id]
            );
        }
        await db.execute("DELETE FROM Ranking WHERE id = $1", [sourceRank.id]);
    } else if (!targetRank && sourceRank) {
        await db.execute(
            "UPDATE Ranking SET media_id = $1 WHERE id = $2",
            [targetMediaId, sourceRank.id]
        );
    }

    // 3. Delete source media row since everything has been consolidated
    await db.execute("DELETE FROM Media WHERE id = $1", [sourceMediaId]);
}

/**
 * Scans the database across all registered provider migration rules and deduplicates
 * legacy media entries against existing target media entries with matching titles.
 */
export async function reconcileProviderMigrations(db: Database) {
    try {
        for (const [targetProvider, legacySources] of Object.entries(PROVIDER_MIGRATION_RULES)) {
            for (const legacySource of legacySources) {
                const legacyMediaList = await db.select<any[]>(
                    "SELECT * FROM Media WHERE source_api = $1",
                    [legacySource]
                );
                if (!legacyMediaList || legacyMediaList.length === 0) continue;

                for (const legacyItem of legacyMediaList) {
                    const targetMatches = await db.select<any[]>(
                        "SELECT id, title FROM Media WHERE source_api = $1 AND (LOWER(TRIM(title)) = LOWER(TRIM($2)) OR alternative_titles LIKE $3) LIMIT 1",
                        [targetProvider, legacyItem.title, `%${legacyItem.title}%`]
                    );

                    if (targetMatches && targetMatches.length > 0) {
                        const targetId = targetMatches[0].id;
                        console.log(`[deduplication] Merging legacy ${legacySource} record "${legacyItem.title}" (${legacyItem.id}) into ${targetProvider} record (${targetId})`);
                        await mergeMediaRecords(db, targetId, legacyItem.id);
                    }
                }
            }
        }
    } catch (err) {
        console.warn("[deduplication] Failed to run provider migration deduplication:", err);
    }
}

// Backward-compatible alias
export const deduplicateAndMigrateLegacyMedia = reconcileProviderMigrations;

/**
 * Updates the external_id and source_api of a dummy imported Media item
 * to link it to a real external API item. Also updates the cache fields.
 */
export async function linkMediaToRealId(mediaId: string, newExternalId: string, newSourceApi: string, newType: string, newTitle: string, newCoverUrl: string | null) {
    const db = await getDb();

    // Check if another Media row already has the new external_id and source_api
    const existing = await db.select<any[]>(
        "SELECT id FROM Media WHERE external_id = $1 AND source_api = $2 AND id != $3 LIMIT 1",
        [newExternalId, newSourceApi, mediaId]
    );

    if (existing && existing.length > 0) {
        const realMediaId = existing[0].id;
        await mergeMediaRecords(db, realMediaId, mediaId);
    } else {
        // Safe to update the dummy media row in place
        await db.execute(
            "UPDATE Media SET external_id = $1, source_api = $2, type = $3, title = $4, cover_image_path = COALESCE($5, cover_image_path) WHERE id = $6",
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
