import { upsertMedia, saveTracking, getDb } from './db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Shape of a single media entry returned by the BFF import endpoint.
 */
export interface ImportedMediaDto {
    title: string;
    type: string;
    status: string;
    score: number;
    progress: number;
    totalProgressUnits: number | null;
    startDate: string | null;
    endDate: string | null;
}

/**
 * Returns true when the search result title is close enough to the import title
 * to be considered the correct match.
 *
 * @param importedTitle The raw title from the import file.
 * @param resultTitle   The title returned by the BFF search endpoint.
 * @returns `true` if the titles are a confident match; `false` otherwise.
 */
function isTitleMatch(importedTitle: string, resultTitle: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const a = normalize(importedTitle);
    const b = normalize(resultTitle);
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    // Simple overlap ratio: 80% threshold
    const shorter = a.length < b.length ? a : b;
    const longer  = a.length < b.length ? b : a;
    return shorter.length / longer.length >= 0.8;
}

/**
 * Sends a file to the BFF import route, which parses the file and returns a list of ImportedMediaDto.
 * Then iterates through the list, calling local SQLite methods to save Media and Tracking data.
 */
export async function importMediaFromFile(
    file: File, 
    provider: 'mal' | 'letterboxd', 
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`http://localhost:5244/api/v1/import/${provider}`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
    }
    const responseBody = await response.json();
    const importedList: ImportedMediaDto[] = responseBody.data;
    let count = 0;

    for (const item of importedList) {
        let externalId = `imported_${uuidv4()}`;
        let sourceApi = provider.toUpperCase();
        let coverImageUrl = null;
        let releaseDate = null;
        let description = null;

        try {
            const searchResponse = await fetch(
                `http://localhost:5244/api/v1/search?query=${encodeURIComponent(item.title)}&type=${item.type}`
            );
            if (searchResponse.ok) {
                const searchBody = await searchResponse.json();
                const results = searchBody.data;
                if (results && results.length > 0) {
                    const firstResult = results[0];

                    if (isTitleMatch(item.title, firstResult.title ?? '')) {
                        externalId      = firstResult.externalId  || externalId;
                        sourceApi       = firstResult.sourceApi   || sourceApi;
                        coverImageUrl   = firstResult.coverImageUrl ?? null;
                        releaseDate     = firstResult.releaseDate   ?? null;
                        description     = firstResult.description   ?? null;
                    } else {
                        console.warn(
                            `[import] Title mismatch — imported: "${item.title}", search returned: "${firstResult.title}". Keeping placeholder ID.`
                        );
                    }
                }
            }
        } catch (error) {
            console.error(`[import] Search failed for "${item.title}":`, error);
        }

        const media = {
            externalId,
            sourceApi,
            type: item.type,
            title: item.title,
            description,
            coverImageUrl,
            releaseDate,
            genres: []
        };

        const mediaId = await upsertMedia(media);
        await saveTracking(
            mediaId,
            item.status,
            item.score > 0 ? item.score : null,
            item.progress,
            item.totalProgressUnits,
            null,
            item.startDate,
            item.endDate
        );

        count++;
        if (onProgress) {
            onProgress(count, importedList.length);
        }
        await new Promise(r => setTimeout(r, 250));
    }
}

/**
 * Restores a complete relational library backup JSON structure.
 * Performs index-respecting upserts for Media and UserTracking,
 * and overwrites historic sessions and tracking events per item.
 *
 * @param backupData The parsed JSON backup data
 * @param onProgress Optional progress status reporting callback
 */
export async function importBackupData(
    backupData: any,
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    if (!backupData || backupData.version !== "1.0" || !Array.isArray(backupData.items)) {
        throw new Error("Invalid backup format. File must be a Grabbe Backup version 1.0.");
    }

    const items = backupData.items;
    let count = 0;
    const db = await getDb();

    for (const item of items) {
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
            genres: media.genres || []
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

        count++;
        if (onProgress) {
            onProgress(count, items.length);
        }
        
        // Add minor scheduling buffer to prevent thread block in Tauri select queues
        await new Promise(r => setTimeout(r, 50));
    }
}