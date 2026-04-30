import { useState } from 'react';
import { MediaCard, MediaStatus } from '../shared/MediaCard';

const dummyData = [
  {
    id: 1,
    title: 'Neon Syndicate',
    subtitle: 'TV Series • S02 E04',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiMEg3wONyuKdM9Iq76hBhyqwAOjASfn7u1LLqpkaOYXwaiLjLo8YjMyyYBQlK8sFu-GvR_9sBTs3IpQGQWuRvtqkvyrc3sr97f6HqRGVAV5t-bTQdTRl85CtzFabFXDt_2LTxPYOB-N97FVmz-7N5QEd6j_rhorBo876G_ynxz3oN-VRxK-2IitNpJZj_7Bzl0i5j-WMcbGKRS5vrEKIsV6cwALhMVdshmKYRbT_fpfHDynuUWcYRsvaPsuNefspepcr9RikFsUCD',
    status: 'CONSUMING' as MediaStatus
  },
  {
    id: 2,
    title: 'The Silent Pines',
    subtitle: 'Film • 2023',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJBBMKHlB8SEE7o2imZFzpaxxOO4qDiPlnf0knxf9GYrNb0D97ZuzPGi5ld0FfYJwHkIBdbBUIDr7ZcBSGTKde6c0nZMUn7bGovrNan1fLuV52Rz2NET872wB9F9YczIGrCv6YnXYfQospkTb9UA4RBVqajYtZXBhCbXpGg8kxlxlxxmU_y_XhuOSiDQ5Hc2iyKAtotHLv1iwJikvo59oJUCadqmCUfcBmZKGDwwTRcjMnzwwzkeYgel6ZhkAFk7xQYFU9Kna_m9mM',
    status: 'COMPLETED' as MediaStatus
  },
  {
    id: 3,
    title: 'Cyber Protocol',
    subtitle: 'Game • PC',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnzqjc2tnsbv_X5cUl17Ox4lYzgJqBBKmXKAenlwSe7caUfAfQQoPGoYadK96t12eq4l66Y17qrpIVK9lzmMDQk7hcTsqe9K7xmcpaaOpGIMlZN7XO4qI_sloOAKMi1ftjlOfZsHiHvvuDjyiO4V-o-0WDJTfP878Zqqbfg4l_rYDH0gVHJH6zcgsFNQDwfcudf_KAXztFdjLQOzpQYhDTHsktFAvu05c-m2b56-Sp79gK4zFUn6_EY2oHeZk2iU9jWMZvieTePv3q',
    status: 'CONSUMING' as MediaStatus
  },
  {
    id: 4,
    title: 'The Last Director',
    subtitle: 'Documentary',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXqThmX8uFgCmAw7oIFKEJphrgWkciBZEI4LEa1cqccNionnUpqUOMpZYQCUjBH3_3vJBMromd9i2pAcxV8og2M6zCkjZG0Kl0adbTlbkOyHONJmUBmymVOFV9ON0pJpYcxGJpX6wy5-zwa6I0k7iEFN8cDj33zLTjz-wcdSW8Yr44SMai1GFQ6ytt4Kl-g0IRzvqQufNXhDPi1r96mkBYIMGDCrrI0RdkgAuTEtI1RyBy-_OZbq2kCaKjh_s7W70Xq58CLGCaAAvI',
    status: 'DROPPED' as MediaStatus
  },
  {
    id: 5,
    title: 'Silver Screen Noir',
    subtitle: 'Film • TBA',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsZHUrhhaA20b6djoee8Er5p8i4OnzswMu78pF807X0CASr76-BeYoA5jjTj55Kc1dc4tAAcJWIyKihnWTxO2V5tAWKGPeTkDfKV18Z1QrXbz7n9C0O7qKRIcoHjeYtPPtdxHRvod5LbiEb98txhodJ2XhBTkJPkeUrPv-naiD1eG7lBly_FLeyNSxNnpPvchl2K667A_arWVcDhZKEuYEphBOkKcHEyLrmz45Th4ZCiyCuDg22aO28iQW65SlRwCffyKt9NxCaL8O',
    status: 'PLANNED' as MediaStatus
  },
  {
    id: 6,
    title: 'Void Walker',
    subtitle: 'Anime • Ep 12/24',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATzec5HP-QpdWLSvCMM-slvnIItXEqEYHQgNuHL69MphVdB22soPL_WqbTTLzo3Db-TILCBHtyYlD9rYQTMS1x-0USiMJO_2U9U8RBj-llARzPkBlylwc3EfW1CSyIT5sJSs0Z7B9quSg4COzeFqYhwRqWG8Goo306z6_NeisbcP7yborD0jM5_YjmdBWR3J8nAekBv_cPcS2LUwkdmK8ImuygnqzIo-13zA32dnxlnZen6KT3XFz91jvTEFsCdt3I0JIq8o-OyGuG',
    status: 'CONSUMING' as MediaStatus
  },
  {
    id: 7,
    title: 'Liquid Dreams',
    subtitle: 'Experimental Film',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIVDq-OZu0s9pehDqa5AUnmtLj2VF4KOL7w8NYW7qbfnUTm6iSbITAxk2Hf3qw1KsSixnFocXJWMaQ82NIiK-s-_nVhTmv7CkZvmTFPBK2REW1bnw_gPgxxlq7i-C2rdveoqx9wlrUT9UZG9_Vnb7eMRiAZyQbvEwZFT813leS25xWHH0cSn24qfJmC-TOQL2eLhGZECgOTey7dAR-jdsrGsyExBMZou5qFs95sfGZFpK2BQzNfUGYBKRdoWXJ3MP5NmHNyHfkXLVq',
    status: 'COMPLETED' as MediaStatus
  },
  {
    id: 8,
    title: 'Circuit Breaker',
    subtitle: 'Game • Console',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrzCpVtzNnBfpHJ0NH1YPCmDg-xoFokiirlAxWgrqf7shNX_DYkI3azNVg5mvpaqOuN9ov54TwgwyGFWI2OWxc6dDpmr_QdpWJQbADKJISwrCv-6mGFNx30eMZ8PplkXBqKb_UJXdU8aNEC3UkSBx75XeoikJUMN0dKXf-AGgAsWKXGd9lMhZwgslxwc5VRTq2r-Hj4EyzrmTnUScN0DyOyoN6m6KZaoFUtQUqz2FI9B4U0LBLWD84cGWUTST9dqZButkXoqEZObQc',
    status: 'PLANNED' as MediaStatus
  },
  {
    id: 9,
    title: 'Projector Tales',
    subtitle: 'Web Series',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLzw-KJt9qagDl_tQcHgzoY8S9C-UDN83gwfBpSNBUw_rDt0hCmS0ow9f47BKCwpJdvTWWtjC_uISLqACFeEslQK8NP3dpTJB4NXOU5T4jajNJko_rLLZz2Lq0K2KN7hO7nbI1m6pOKh8IhW0gOOBkJjOlHUIW9ZGA7PBAz-FgQnsPWkfxvj6lkDopPvuo4BmSUT1ilrShCedNlDoaOOXEKm9BgRt7lE4Le2veDr5ubr1NjCkH7fPe5LR7eLE7gaB6U-BqyPilXbYe',
    status: 'CONSUMING' as MediaStatus
  },
  {
    id: 10,
    title: 'Curtains Down',
    subtitle: 'Short Film',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMJiTFucfY18qI1t53XEufDQ3D62C9n2bLIZx8iQ6_qB8Crszbc1gbafEDdqQTonxU_TpuTyQOfezQGXJhHG9Mppl7DzCcUX8yUSJ4Rg-MYgxgTsfdWFWWnyndc6WlIQVjLXWAJoNfEZNkFGCaR8NV3K4SphSMjYH6EZWj2rIQndEUaAK8JHjS3EXvjwz2peZU7G_fYr1OPylil2cLq3CybZcr14mFRcAIg0Uikkd2u0q9j_keTyNzosp6t2GmITX6LK91vNfFRNIM',
    status: 'COMPLETED' as MediaStatus
  },
  {
    id: 11,
    title: 'Gothic Echoes',
    subtitle: 'Horror Series',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDizuS4WgBmdC408bA1OhuaI8nAa9bV7OtwaNqYtvGthXzqqYBt24Hk7fYd4KegV-vnoLEd9ma-Y74WaVm2ibDnZKO432Ji9KZrkOlFL6Pg0f-ZM73DW_yUSlrGF4J1p4Qeb0syPgt_9T8pjbLMwIQ8BoaYDQQ77nE22H5-RmM1mkUka_lh65ivvT9bym4JoCQIcVZbStgZh8qKO1PnIHtmlbeT2rf40mypmfeBcya2N5RQ4EjOFRiQUewzDeUvNCfmD9xe4DscMd__',
    status: 'DROPPED' as MediaStatus
  },
  {
    id: 12,
    title: 'Orbs of Gaia',
    subtitle: 'Game • VR',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3Zr5nn1PB2y7qU61u4VSS4SF3EnAmAAyhzT9F-xMKkKQt7k48yHQXy8BlNEs0ko50F-jj_ypqIqj4EC7sAeguXGEAWPvLWz5DyWjqBDAayxBhHuDzQwY4tZyYpnCFOAYaq1pS5OqwmjHtQ6AXikFqMmYxSUFYeU0nVQEYlYW4NupuL_OdAHAa6LheO0I56zuAe8s1-7pp6NzLDhzqI1dER4EirGVgmy7iHgsxFpLWOSa45yQKtdpcODMhMklVnxTdrwLlke56v7MI',
    status: 'CONSUMING' as MediaStatus
  },
  {
    id: 13,
    title: 'Echoes of the Past',
    subtitle: 'Film • 1998',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLzw-KJt9qagDl_tQcHgzoY8S9C-UDN83gwfBpSNBUw_rDt0hCmS0ow9f47BKCwpJdvTWWtjC_uISLqACFeEslQK8NP3dpTJB4NXOU5T4jajNJko_rLLZz2Lq0K2KN7hO7nbI1m6pOKh8IhW0gOOBkJjOlHUIW9ZGA7PBAz-FgQnsPWkfxvj6lkDopPvuo4BmSUT1ilrShCedNlDoaOOXEKm9BgRt7lE4Le2veDr5ubr1NjCkH7fPe5LR7eLE7gaB6U-BqyPilXbYe',
    status: 'PENDING' as MediaStatus
  }
];

export const LibraryGrid = () => {
  const [displayCount, setDisplayCount] = useState(12);

  const displayedItems = dummyData.slice(0, displayCount);
  const hasMore = displayCount < dummyData.length;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {displayedItems.map(item => (
          <MediaCard key={item.id} variant="library" {...item} />
        ))}
      </div>
      
      {/* Pagination or Load More */}
      {hasMore && (
        <div className="mt-20 flex justify-center">
          <button 
            onClick={() => setDisplayCount(prev => prev + 12)}
            className="flex items-center gap-2 px-8 py-4 bg-surface-container-high rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all duration-300 group text-text-high"
          >
            Load More Entries
            <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform">expand_more</span>
          </button>
        </div>
      )}
    </>
  );
};
