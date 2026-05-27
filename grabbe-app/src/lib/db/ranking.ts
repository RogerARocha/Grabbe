import { getDb } from './connection';

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
    SELECT m.*, ut.status, ut.progress, ut.total_progress, ut.review_text, r.score, ut.updated_at,
           (SELECT MAX(finish_date) FROM ConsumptionSession cs WHERE cs.tracking_id = ut.id) as finish_date
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
