export const getPublisherLabel = (type?: string) => {
  switch (type) {
    case 'BOOK':
    case 'MANGA':
      return 'Publisher';
    case 'GAME':
      return 'Developer / Publisher';
    case 'SERIES':
      return 'Network';
    case 'ANIME':
    case 'MOVIE':
    default:
      return 'Studio';
  }
};

export const getTypeLabel = (type?: string) => {
  switch (type) {
    case 'SERIES': return 'TV Series';
    case 'MOVIE': return 'Film';
    case 'ANIME': return 'Anime';
    case 'MANGA': return 'Manga';
    case 'BOOK': return 'Book';
    case 'GAME': return 'Game';
    default: return type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : 'Unknown';
  }
};
