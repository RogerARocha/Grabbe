import { useState, useEffect } from 'react';
import { getTrackingByExternalId, removeTrackingByExternalId, saveTracking, startRewatch, linkMediaToRealId, unlinkMedia } from '../lib/db';

interface UseMediaTrackingParams {
  externalId: string | undefined;
  sourceApi: string | null;
  type: string | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  navigate: (path: string, options?: any) => void;
}

export function useMediaTracking({
  externalId,
  sourceApi,
  type,
  showToast,
  navigate
}: UseMediaTrackingParams) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'update'>('add');
  const [isInLibrary, setIsInLibrary] = useState(false);
  
  const [tracking, setTracking] = useState<any>({
    status: 'PLANNED',
    currentProgress: 0,
    totalProgress: 0,
    progressLabel: '',
    userScore: undefined,
    startDate: undefined,
    endDate: undefined,
    reviewText: '',
    rewatchCount: 0,
    trackingId: undefined,
    mediaId: undefined,
    sessions: [],
    historyEvents: []
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    type: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    type: 'info',
    onConfirm: () => {}
  });

  const refreshTracking = async () => {
    if (!externalId || !sourceApi) return;
    const data = await getTrackingByExternalId(externalId, sourceApi);
    if (data) {
      setIsInLibrary(true);
      setTracking((prev: any) => ({
        ...prev,
        status: data.status,
        currentProgress: data.progress || 0,
        totalProgress: data.total_progress || prev.totalProgress,
        userScore: data.score,
        reviewText: data.reviewTextFromRanking || data.review_text || '',
        startDate: data.startDate,
        endDate: data.endDate,
        rewatchCount: data.rewatch_count ?? 0,
        trackingId: data.id,
        mediaId: data.media_id,
        sessions: data.sessions || [],
        historyEvents: data.historyEvents || []
      }));
    } else {
      setIsInLibrary(false);
    }
  };

  useEffect(() => {
    refreshTracking();
  }, [externalId, sourceApi, isModalOpen]);

  const handleAddClick = () => {
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleUpdateClick = () => {
    setModalMode('update');
    setIsModalOpen(true);
  };

  const handleRemoveClick = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove from Library',
      message: 'Are you sure you want to remove this from your library? This will permanently delete all tracking progress, history, and review entries associated with this media.',
      confirmLabel: 'Remove from Library',
      type: 'danger',
      onConfirm: async () => {
        if (externalId && sourceApi) {
          await removeTrackingByExternalId(externalId, sourceApi);
          refreshTracking();
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRewatchClick = async () => {
    if (!tracking.trackingId || !tracking.mediaId) return;
    await startRewatch(tracking.trackingId, tracking.mediaId);
    refreshTracking();
  };

  const handleQuickProgress = async () => {
    if (!isInLibrary || !tracking || !externalId || !sourceApi) return;

    const effectiveTotal = tracking.totalProgress || 0;
    const newProgress = (tracking.currentProgress || 0) + 1;
    if (effectiveTotal > 0 && newProgress > effectiveTotal) return;

    const data = await getTrackingByExternalId(externalId, sourceApi);
    if (data) {
      let newStatus = data.status;
      let newStartDate = data.startDate;
      let newEndDate = data.endDate;

      if (newStatus === 'PLANNED' || newStatus === 'DROPPED' || newStatus === 'ON HOLD') {
        newStatus = 'CONSUMING';
        if (!newStartDate) {
          newStartDate = new Date().toISOString();
        }
      }

      if (effectiveTotal > 0 && newProgress >= effectiveTotal) {
        newStatus = 'COMPLETED';
        if (!newEndDate) {
          newEndDate = new Date().toISOString();
        }
      }

      await saveTracking(data.media_id, newStatus, data.score, newProgress, data.total_progress, data.review_text, newStartDate, newEndDate);
      refreshTracking();
    }
  };

  const handleSelectResult = async (result: any) => {
    if (!tracking.mediaId) return;
    try {
      await linkMediaToRealId(tracking.mediaId, result.externalId, result.sourceApi, result.type, result.title, result.coverImageUrl || null);
      navigate(`/media/${result.externalId}?source=${result.sourceApi}&type=${result.type}`, { replace: true });
      window.location.reload();
    } catch (err) {
      console.error("Link failed", err);
      showToast("Failed to link media. Check console for details.", "error");
    }
  };

  const handleUnlink = async () => {
    if (!tracking.mediaId) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Unlink Metadata',
      message: 'Are you sure you want to unlink this media? This will clear the online details and allow you to search and link a different item manually.',
      confirmLabel: 'Unlink Media',
      type: 'danger',
      onConfirm: async () => {
        try {
          const newExternalId = await unlinkMedia(tracking.mediaId!);
          navigate(`/media/${newExternalId}?source=${sourceApi}&type=${type}`, { replace: true });
          window.location.reload();
        } catch (err) {
          console.error("Unlink failed", err);
          showToast("Failed to unlink media.", "error");
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return {
    isModalOpen,
    setIsModalOpen,
    modalMode,
    isInLibrary,
    tracking,
    setTracking,
    confirmConfig,
    setConfirmConfig,
    refreshTracking,
    handleAddClick,
    handleUpdateClick,
    handleRemoveClick,
    handleRewatchClick,
    handleQuickProgress,
    handleSelectResult,
    handleUnlink
  };
}
