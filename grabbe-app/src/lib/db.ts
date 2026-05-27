export { getDb, initDb } from './db/connection';
export { upsertMedia, getMediaByExternalId, linkMediaToRealId, unlinkMedia } from './db/media';
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
