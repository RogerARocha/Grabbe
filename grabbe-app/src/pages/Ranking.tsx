import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { TypeFilters } from '../components/shared/TypeFilters';
import { RankingList } from '../components/ranking/RankingList';
import { getRankedItems, getTrackingForMedia } from '../lib/db';
import { EvaluationModal } from '../components/modals/EvaluationModal';
import { useRankingStore } from '../store/rankingStore';

export const Ranking = () => {
  const { 
    activeTab, 
    setActiveTab,
    items, 
    setItems, 
    isLoading, 
    setIsLoading,
    scrollPosition,
    setScrollPosition
  } = useRankingStore();
  
  // Evaluation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const hasRestoredScroll = useRef(false);

  const fetchItems = async () => {
    // Only show loading indicator if we don't have items already loaded
    if (items.length === 0) {
      setIsLoading(true);
    }
    try {
      const data = await getRankedItems(activeTab);
      setItems(data || []);
    } catch (error) {
      console.error("Failed to fetch ranked items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  // Track the scroll position of the MainLayout viewport
  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const handleScroll = () => {
      setScrollPosition(mainEl.scrollTop);
    };

    mainEl.addEventListener('scroll', handleScroll);
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [setScrollPosition]);

  // Reset scroll restoration state when activeTab changes
  useEffect(() => {
    hasRestoredScroll.current = false;
  }, [activeTab]);

  // Restore the scroll position once the items are loaded and rendered
  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl || hasRestoredScroll.current || isLoading) return;

    if (scrollPosition > 0 && items.length > 0) {
      // Small delay to ensure the DOM has repainted the items
      const timer = setTimeout(() => {
        mainEl.scrollTo({ top: scrollPosition });
        hasRestoredScroll.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [items, isLoading, scrollPosition]);

  const handleOpenModal = async (item: any) => {
    const tracking = await getTrackingForMedia(item.id);
    setSelectedItem({
      ...item,
      startDate: tracking?.startDate,
      endDate: tracking?.endDate
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    fetchItems(); // Refresh list after potential updates
  };

  return (
    <MainLayout>
      <div className="mb-10">
        <h1 className="text-5xl font-black tracking-tighter text-text-high mb-2">Ranking</h1>
        <p className="text-sm font-medium text-text-muted max-w-2xl">
          Your curated list of evaluated media, sorted by your personal scores.
        </p>
      </div>

      <div className="mb-12">
        <TypeFilters activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <RankingList 
        items={items} 
        isLoading={isLoading} 
        onOpenModal={handleOpenModal} 
      />

      {isModalOpen && selectedItem && (
        <EvaluationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode="update"
          media={{
            id: selectedItem.id, 
            externalId: selectedItem.external_id,
            sourceApi: selectedItem.source_api,
            type: selectedItem.type,
            title: selectedItem.title,
            coverImageUrl: selectedItem.cover_image_path,
            totalProgressUnits: selectedItem.total_progress
          }}
          initialMediaName={selectedItem.title}
          initialStatus={selectedItem.status}
          initialScore={selectedItem.score}
          initialProgress={selectedItem.progress}
          initialStartDate={selectedItem.startDate}
          initialEndDate={selectedItem.endDate}
          initialReviewText={selectedItem.review_text}
        />
      )}
    </MainLayout>
  );
};
