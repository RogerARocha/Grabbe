import { upsertMedia, saveTracking } from './db';
import { v4 as uuidv4 } from 'uuid';
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
            const searchResponse = await fetch(`http://localhost:5244/api/v1/search?query=${encodeURIComponent(item.title)}&type=${item.type}`);
            if (searchResponse.ok) {
                const searchBody = await searchResponse.json();
                const results = searchBody.data;
                if (results && results.length > 0) {
                    const firstResult = results[0];
                    externalId = firstResult.externalId || externalId;
                    sourceApi = firstResult.sourceApi || sourceApi;
                    coverImageUrl = firstResult.coverImageUrl || null;
                    releaseDate = firstResult.releaseDate || null;
                    description = firstResult.description || null;
                }
            }
        } catch (error) {
            console.error(`Search failed for ${item.title}:`, error);
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