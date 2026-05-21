import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { TypeFilters } from '../components/shared/TypeFilters';
import { RankingList } from '../components/ranking/RankingList';
import { getRankedItems, getTrackingForMedia } from '../lib/db';
import type { MediaType } from '../components/shared/types';
import { EvaluationModal } from '../components/modals/EvaluationModal';
import { useRankingStore } from '../store/rankingStore';

export const Ranking = () => {
  const { activeTab, setActiveTab } = useRankingStore();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Evaluation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const data = await getRankedItems(activeTab);
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch ranked items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

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
