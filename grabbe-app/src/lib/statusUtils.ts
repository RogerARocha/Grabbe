export function getConsumingLabel(mediaType?: string): string {
  switch (mediaType?.toUpperCase()) {
    case 'GAME':
      return 'Currently Playing';
    case 'BOOK':
    case 'MANGA':
    case 'COMIC':
      return 'Currently Reading';
    default:
      return 'Currently Watching';
  }
}

export function getPlannedLabel(mediaType?: string): string {
  switch (mediaType?.toUpperCase()) {
    case 'GAME':
      return 'Plan to Play';
    case 'BOOK':
    case 'MANGA':
    case 'COMIC':
      return 'Plan to Read';
    default:
      return 'Plan to Watch';
  }
}

export function formatStatusLabel(status: string, mediaType?: string): string {
  switch (status.toUpperCase()) {
    case 'PLANNED':
      return getPlannedLabel(mediaType);
    case 'CONSUMING':
      return getConsumingLabel(mediaType);
    case 'COMPLETED':
      return 'Completed';
    case 'DROPPED':
      return 'Dropped';
    case 'ON HOLD':
    case 'ON_HOLD':
      return 'On Hold';
    default:
      return status;
  }
}
