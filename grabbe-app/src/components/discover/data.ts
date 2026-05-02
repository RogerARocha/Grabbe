import { MediaType } from '../shared/MediaCard';



export const SOURCE_COLOR: Record<string, string> = {
  TMDB: 'text-primary',
  JIKAN: 'text-warning',
  GBOOKS: 'text-secondary',
  IGDB: 'text-tertiary',
};

export interface DiscoverResult {
  id: string;
  title: string;
  type: MediaType;
  coverImageUrl: string | null;
  releaseDate: string | null;
  genres: string[];
  communityScore: number | null;
  formattedConsumptionMetric: string | null;
  sourceApi: string;
}

export const MOCK_RESULTS: DiscoverResult[] = [
  {
    id: '1',
    title: 'Breaking Bad',
    type: 'SERIES',
    coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJBBMKHlB8SEE7o2imZFzpaxxOO4qDiPlnf0knxf9GYrNb0D97ZuzPGi5ld0FfYJwHkIBdbBUIDr7ZcBSGTKde6c0nZMUn7bGovrNan1fLuV52Rz2NET872wB9F9YczIGrCv6YnXYfQospkTb9UA4RBVqajYtZXBhCbXpGg8kxlxlxxmU_y_XhuOSiDQ5Hc2iyKAtotHLv1iwJikvo59oJUCadqmCUfcBmZKGDwwTRcjMnzwwzkeYgel6ZhkAFk7xQYFU9Kna_m9mM',
    releaseDate: '2008',
    genres: ['Drama', 'Crime', 'Thriller'],
    communityScore: 9.5,
    formattedConsumptionMetric: '62 episodes',
    sourceApi: 'TMDB',
  },
  {
    id: '2',
    title: 'Hunter x Hunter (2011)',
    type: 'ANIME',
    coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsZHUrhhaA20b6djoee8Er5p8i4OnzswMu78pF807X0CASr76-BeYoA5jjTj55Kc1dc4tAAcJWIyKihnWTxO2V5tAWKGPeTkDfKV18Z1QrXbz7n9C0O7qKRIcoHjeYtPPtdxHRvod5LbiEb98txhodJ2XhBTkJPkeUrPv-naiD1eG7lBly_FLeyNSxNnpPvchl2K667A_arWVcDhZKEuYEphBOkKcHEyLrmz45Th4ZCiyCuDg22aO28iQW65SlRwCffyKt9NxCaL8O',
    releaseDate: '2011',
    genres: ['Action', 'Adventure', 'Fantasy'],
    communityScore: 9.1,
    formattedConsumptionMetric: '23 min per ep',
    sourceApi: 'JIKAN',
  },
  {
    id: '3',
    title: 'Dune',
    type: 'MOVIE',
    coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnzqjc2tnsbv_X5cUl17Ox4lYzgJqBBKmXKAenlwSe7caUfAfQQoPGoYadK96t12eq4l66Y17qrpIVK9lzmMDQk7hcTsqe9K7xmcpaaOpGIMlZN7XO4qI_sloOAKMi1ftjlOfZsHiHvvuDjyiO4V-o-0WDJTfP878Zqqbfg4l_rYDH0gVHJH6zcgsFNQDwfcudf_KAXztFdjLQOzpQYhDTHsktFAvu05c-m2b56-Sp79gK4zFUn6_EY2oHeZk2iU9jWMZvieTePv3q',
    releaseDate: '2021',
    genres: ['Sci-Fi', 'Adventure'],
    communityScore: 8.0,
    formattedConsumptionMetric: '2h 35m',
    sourceApi: 'TMDB',
  },
  {
    id: '4',
    title: 'The Name of the Wind',
    type: 'BOOK',
    coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXqThmX8uFgCmAw7oIFKEJphrgWkciBZEI4LEa1cqccNionnUpqUOMpZYQCUjBH3_3vJBMromd9i2pAcxV8og2M6zCkjZG0Kl0adbTlbkOyHONJmUBmymVOFV9ON0pJpYcxGJpX6wy5-zwa6I0k7iEFN8cDj33zLTjz-wcdSW8Yr44SMai1GFQ6ytt4Kl-g0IRzvqQufNXhDPi1r96mkBYIMGDCrrI0RdkgAuTEtI1RyBy-_OZbq2kCaKjh_s7W70Xq58CLGCaAAvI',
    releaseDate: '2007',
    genres: ['Fantasy', 'Epic'],
    communityScore: 8.8,
    formattedConsumptionMetric: '662 pages',
    sourceApi: 'GBOOKS',
  },
  {
    id: '5',
    title: 'Elden Ring',
    type: 'GAME',
    coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDizuS4WgBmdC408bA1OhuaI8nAa9bV7OtwaNqYtvGthXzqqYBt24Hk7fYd4KegV-vnoLEd9ma-Y74WaVm2ibDnZKO432Ji9KZrkOlFL6Pg0f-ZM73DW_yUSlrGF4J1p4Qeb0syPgt_9T8pjbLMwIQ8BoaYDQQ77nE22H5-RmM1mkUka_lh65ivvT9bym4JoCQIcVZbStgZh8qKO1PnIHtmlbeT2rf40mypmfeBcya2N5RQ4EjOFRiQUewzDeUvNCfmD9xe4DscMd__',
    releaseDate: '2022',
    genres: ['RPG', 'Action', 'Open World'],
    communityScore: 9.4,
    formattedConsumptionMetric: '~60h',
    sourceApi: 'IGDB',
  },
  {
    id: '6',
    title: 'Neon Genesis Evangelion',
    type: 'ANIME',
    coverImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATzec5HP-QpdWLSvCMM-slvnIItXEqEYHQgNuHL69MphVdB22soPL_WqbTTLzo3Db-TILCBHtyYlD9rYQTMS1x-0USiMJO_2U9U8RBj-llARzPkBlylwc3EfW1CSyIT5sJSs0Z7B9quSg4COzeFqYhwRqWG8Goo306z6_NeisbcP7yborD0jM5_YjmdBWR3J8nAekBv_cPcS2LUwkdmK8ImuygnqzIo-13zA32dnxlnZen6KT3XFz91jvTEFsCdt3I0JIq8o-OyGuG',
    releaseDate: '1995',
    genres: ['Mecha', 'Psychological', 'Sci-Fi'],
    communityScore: 8.5,
    formattedConsumptionMetric: '24 min per ep',
    sourceApi: 'JIKAN',
  },
];