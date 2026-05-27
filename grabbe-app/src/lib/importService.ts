import { upsertMedia, saveTracking, importBackupItem } from './db';
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
        let formattedConsumptionMetric = null;
        let releaseYear = null;
        let communityScore = null;
        let publisherOrStudio = null;
        let originalLanguage = null;
        let alternativeTitles = [] as string[];
        let keyPeople = [] as any[];
        let genres = [] as string[];
        let totalProgressUnits = item.totalProgressUnits;

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
                        
                        try {
                            const detailsResponse = await fetch(`http://localhost:5244/api/v1/media/${sourceApi}/${firstResult.type}/${externalId}`);
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

        const media = {
            externalId,
            sourceApi,
            type: item.type,
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
            item.status,
            item.score > 0 ? item.score : null,
            item.progress,
            totalProgressUnits,
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

    for (const item of items) {
        const { media } = item;

        let metric = media.consumption_metric || null;
        let didFetch = false;

        // Backfill missing metric for older backups
        if (!metric && media.source_api && media.external_id && !media.external_id.startsWith('imported_')) {
            try {
                const detailsResponse = await fetch(`http://localhost:5244/api/v1/media/${media.source_api}/${media.type}/${media.external_id}`);
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