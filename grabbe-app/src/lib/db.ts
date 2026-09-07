export { getDb, initDb } from './db/connection';
export { 
  upsertMedia, 
  getMediaByExternalId, 
  linkMediaToRealId, 
  unlinkMedia, 
  mergeMediaRecords,
  reconcileProviderMigrations, 
  deduplicateAndMigrateLegacyMedia, 
  PROVIDER_MIGRATION_RULES, 
  isKnownLegacyProvider 
} from './db/media';
export { 
  saveTracking, 
  getLibraryItems, 
  getMediaCount, 
  getTrackingForMedia, 
  getTrackingByExternalId, 
  removeTrackingByExternalId, 
  startRewatch, 
  getConsumptionSessions 
} from './db/tracking';
export { getRankedItems } from './db/ranking';
export { exportLibraryData, importBackupItem } from './db/backup';
export { getSetting, setSetting, deleteSetting } from './db/settings';

