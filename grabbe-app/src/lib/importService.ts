import { upsertMedia, saveTracking, importBackupItem, setSetting, getDb, getTrackingByExternalId } from './db';
import { v4 as uuidv4 } from 'uuid';
import { apiFetch } from './httpClient';

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
    provider: 'mal' | 'letterboxd' | 'netflix', 
    onProgress?: (current: number, total: number) => void
): Promise<{ importedCount: number; skippedCount: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiFetch(`/api/v1/import/${provider}`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
    }
    const responseBody = await response.json();
    const importedList: ImportedMediaDto[] = responseBody.data;
    let importedCount = 0;
    let skippedCount = 0;
    let count = 0;

    for (const item of importedList) {
        // Fast local check by title/type to see if it is already added
        const db = await getDb();
        const localMediaByTitle = await db.select<any[]>(
            "SELECT id FROM Media WHERE title = $1 AND type = $2 LIMIT 1",
            [item.title, item.type]
        );
        let isAlreadyAdded = false;
        if (localMediaByTitle && localMediaByTitle.length > 0) {
            const existingTracking = await db.select<any[]>(
                "SELECT id FROM UserTracking WHERE media_id = $1 LIMIT 1",
                [localMediaByTitle[0].id]
            );
            if (existingTracking && existingTracking.length > 0) {
                isAlreadyAdded = true;
            }
        }

        let externalId = `imported_${uuidv4()}`;
        let sourceApi = provider.toUpperCase();
        let coverImageUrl = null;
        let releaseDate = null;
        let description = null;
        let formattedConsumptionMetric = null;
        let releaseYear = null;
        let communityScore = null;
        let publisherOrStudio = null;
        let originalLanguage = null;
        let alternativeTitles = [] as string[];
        let keyPeople = [] as any[];
        let genres = [] as string[];
        let totalProgressUnits = item.totalProgressUnits;
        let resolvedType = item.type;

        try {
            const searchUrl = provider === 'netflix'
                ? `/api/v1/search?query=${encodeURIComponent(item.title)}`
                : `/api/v1/search?query=${encodeURIComponent(item.title)}&type=${item.type}`;
            const searchResponse = await apiFetch(searchUrl);
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
                        resolvedType    = firstResult.type        || resolvedType;
                        
                        // Slower but more accurate check by resolved externalId/sourceApi
                        const existingTracking = await getTrackingByExternalId(externalId, sourceApi);
                        if (existingTracking) {
                            isAlreadyAdded = true;
                        }

                        try {
                            const detailsResponse = await apiFetch(`/api/v1/media/${sourceApi}/${resolvedType}/${externalId}`);
                            if (detailsResponse.ok) {
                                const detailsBody = await detailsResponse.json();
                                if (detailsBody.data) {
                                    const d = detailsBody.data;
                                    formattedConsumptionMetric = d.formattedConsumptionMetric ?? null;
                                    description = d.description ?? description;
                                    coverImageUrl = d.coverImageUrl ?? coverImageUrl;
                                    releaseDate = d.releaseDate ?? releaseDate;
                                    releaseYear = d.releaseYear ?? null;
                                    communityScore = d.communityScore ?? null;
                                    publisherOrStudio = d.publisherOrStudio ?? null;
                                    originalLanguage = d.originalLanguage ?? null;
                                    alternativeTitles = d.alternativeTitles ?? [];
                                    keyPeople = d.keyPeople ?? [];
                                    genres = d.genres ?? [];
                                    if (d.totalProgressUnits !== undefined && d.totalProgressUnits !== null) {
                                        totalProgressUnits = d.totalProgressUnits;
                                    }
                                }
                            }
                        } catch (e) {
                            console.warn(`[import] Could not fetch deep details for "${item.title}"`);
                        }
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

        if (isAlreadyAdded) {
            console.log(`[import] Skipping "${item.title}" because it is already added to the library.`);
            skippedCount++;
            count++;
            if (onProgress) {
                onProgress(count, importedList.length);
            }
            continue;
        }

        let finalStatus = item.status;
        let finalStartDate = item.startDate;
        let finalEndDate = item.endDate;

        // Netflix specific logic for Series/Anime
        if (provider === 'netflix' && (resolvedType === 'SERIES' || resolvedType === 'ANIME')) {
            if (totalProgressUnits && totalProgressUnits > 0) {
                if (item.progress >= totalProgressUnits) {
                    finalStatus = 'COMPLETED';
                    finalStartDate = item.startDate;
                    finalEndDate = item.endDate;
                } else {
                    finalStatus = 'CONSUMING';
                    finalStartDate = item.startDate;
                    finalEndDate = item.endDate;
                }
            } else {
                // Unknown total progress, default to CONSUMING
                finalStatus = 'CONSUMING';
                finalStartDate = item.startDate;
                finalEndDate = item.endDate;
            }
        }

        const media = {
            externalId,
            sourceApi,
            type: resolvedType,
            title: item.title,
            description,
            coverImageUrl,
            releaseDate,
            formattedConsumptionMetric,
            genres,
            releaseYear,
            communityScore,
            publisherOrStudio,
            originalLanguage,
            alternativeTitles,
            keyPeople,
            totalProgressUnits
        };

        const mediaId = await upsertMedia(media);
        await saveTracking(
            mediaId,
            finalStatus,
            item.score > 0 ? item.score : null,
            item.progress,
            totalProgressUnits,
            null,
            finalStartDate,
            finalEndDate
        );

        importedCount++;
        count++;
        if (onProgress) {
            onProgress(count, importedList.length);
        }
        await new Promise(r => setTimeout(r, 250));
    }

    return { importedCount, skippedCount };
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

    if (backupData.userName) {
        await setSetting('USER_NAME', backupData.userName);
    }

    const items = backupData.items;
    let count = 0;

    for (const item of items) {
        const { media } = item;

        let metric = media.consumption_metric || null;
        let didFetch = false;

        // Backfill missing metric for older backups
        if (!metric && media.source_api && media.external_id && !media.external_id.startsWith('imported_')) {
            try {
                const detailsResponse = await apiFetch(`/api/v1/media/${media.source_api}/${media.type}/${media.external_id}`);
                if (detailsResponse.ok) {
                    const detailsBody = await detailsResponse.json();
                    if (detailsBody.data) {
                        metric = detailsBody.data.formattedConsumptionMetric ?? null;
                    }
                }
                didFetch = true;
            } catch (e) {
                console.warn(`[backup-import] Could not fetch deep details for "${media.title}"`);
            }
        }

        // Construct complete relational item to save
        const itemToSave = {
            ...item,
            media: {
                ...item.media,
                consumption_metric: metric
            }
        };

        // Delegate entire database write transactional logic to the db layer
        await importBackupItem(itemToSave);

        count++;
        if (onProgress) {
            onProgress(count, items.length);
        }
        // Add minor scheduling buffer to prevent thread block in Tauri select queues,
        // or a larger delay if we hit the BFF API to respect rate limits.
        if (didFetch) {
            await new Promise(r => setTimeout(r, 250));
        } else {
            await new Promise(r => setTimeout(r, 50));
        }
    }
}