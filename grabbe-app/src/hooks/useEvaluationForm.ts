import { useState, useEffect } from 'react';
import { upsertMedia, saveTracking } from '../lib/db';
import { parsePartialDate, partialDateToInt } from '../components/shared/PartialDateInput';

interface UseEvaluationFormParams {
  isOpen: boolean;
  onClose: () => void;
  media: any;
  initialStatus: string | undefined;
  initialScore: number | null | undefined;
  initialProgress: number | undefined;
  initialStartDate: string | undefined;
  initialEndDate: string | undefined;
  initialReviewText: string | undefined;
}

export function useEvaluationForm({
  isOpen,
  onClose,
  media,
  initialStatus,
  initialScore,
  initialProgress,
  initialStartDate,
  initialEndDate,
  initialReviewText
}: UseEvaluationFormParams) {
  const [isScoreOpen, setIsScoreOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [status, setStatus] = useState('CONSUMING');
  const [progress, setProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedMedia(media || null);
      setStatus(initialStatus || 'CONSUMING');
      setSelectedScore(initialScore || null);
      setProgress(initialProgress || 0);
      setTotalProgress(media?.totalProgressUnits || 0);
      setReviewText(initialReviewText || '');
      
      setStartDate(parsePartialDate(initialStartDate));
      setEndDate(parsePartialDate(initialEndDate));
    }
  }, [isOpen, initialStatus, initialScore, initialProgress, media, initialStartDate, initialEndDate, initialReviewText]);

  const effectiveTotal = totalProgress;

  const rawReleaseDate = selectedMedia?.releaseDate || selectedMedia?.release_date;
  const releaseYear: number | undefined = rawReleaseDate
    ? (parseInt(String(rawReleaseDate).substring(0, 4), 10) || undefined)
    : undefined;

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (endDate && val.length >= 4 && partialDateToInt(val) > partialDateToInt(endDate)) {
      setEndDate('');
    }
  };

  const validDate = (d: string): string | null => (d && d.length >= 4 ? d : null);

  const handleSave = async () => {
    try {
      if (selectedMedia) {
        const mediaId = await upsertMedia(selectedMedia);
        const finalTotalProgress = totalProgress || selectedMedia.totalProgressUnits || null;
        await saveTracking(
          mediaId, status, selectedScore, progress, finalTotalProgress,
          reviewText || null, validDate(startDate), validDate(endDate)
        );
      }
      onClose();
    } catch (e) {
      console.error("Failed to save media tracking", e);
    }
  };

  return {
    isScoreOpen,
    setIsScoreOpen,
    selectedScore,
    setSelectedScore,
    status,
    setStatus,
    progress,
    setProgress,
    totalProgress,
    setTotalProgress,
    reviewText,
    setReviewText,
    selectedMedia,
    setSelectedMedia,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    effectiveTotal,
    releaseYear,
    handleStartDateChange,
    handleSave
  };
}
