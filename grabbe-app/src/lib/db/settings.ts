import { getDb } from './connection';

/**
 * Retrieves a configuration setting value from the AppSettings table by its key.
 * 
 * @param key The unique identifier for the setting (e.g., 'TMDB_API_KEY').
 * @returns The setting value if found, or null.
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  try {
    const results = await db.select<Array<{ value: string }>>(
      'SELECT value FROM AppSettings WHERE key = $1 LIMIT 1',
      [key]
    );
    if (results && results.length > 0) {
      return results[0].value;
    }
  } catch (error) {
    console.error(`[db] Failed to get setting for key "${key}":`, error);
  }
  return null;
}

/**
 * Stores or updates a configuration setting value in the AppSettings table.
 * 
 * @param key The unique identifier for the setting.
 * @param value The value to be stored.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  try {
    await db.execute(
      'INSERT INTO AppSettings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
  } catch (error) {
    console.error(`[db] Failed to set setting for key "${key}":`, error);
    throw error;
  }
}

/**
 * Removes a configuration setting from the AppSettings table.
 * 
 * @param key The unique identifier for the setting to delete.
 */
export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  try {
    await db.execute('DELETE FROM AppSettings WHERE key = $1', [key]);
  } catch (error) {
    console.error(`[db] Failed to delete setting for key "${key}":`, error);
    throw error;
  }
}
