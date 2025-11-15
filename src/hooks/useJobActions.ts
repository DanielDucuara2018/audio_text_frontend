import { useCallback } from 'react';
import { TranscriptionJob } from '../types';

interface UseJobActionsProps {
  currentJob: TranscriptionJob | null;
  onClearJob: () => void;
  onError: (error: string) => void;
  cancelTranscription: () => void;
  resetFile: () => void;
  clearError: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const useJobActions = ({
  currentJob,
  onClearJob,
  onError,
  cancelTranscription,
  resetFile,
  clearError,
  fileInputRef
}: UseJobActionsProps) => {
  
  const resetForm = useCallback(() => {
    resetFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearError();
  }, [resetFile, clearError, fileInputRef]);

  const cancelJob = useCallback(() => {
    if (currentJob) {
      console.log('Cancelling job:', currentJob.id);
    }
    cancelTranscription();
    onClearJob();
    resetForm();
  }, [currentJob, cancelTranscription, onClearJob, resetForm]);

  const startNew = useCallback(() => {
    cancelJob();
    resetForm();
  }, [cancelJob, resetForm]);

  const downloadTranscription = useCallback(async () => {
    if (!currentJob?.result) return;

    const filename = currentJob.downloadFilename || `${currentJob.filename}_transcription.txt`;
    const text = currentJob.result;

    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Try Web Share API first (mobile devices)
    if (isMobile && navigator.share && navigator.canShare) {
      try {
        const file = new File([text], filename, { type: 'text/plain' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Audio Transcription',
            text: 'Transcription from VoiceIA'
          });
          return;
        }
      } catch (error) {
        console.log('Share failed or cancelled:', error);
      }
    }

    // Traditional download method
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        link.target = '_blank';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
      onError('Failed to download. Please try the email option instead.');
    }
  }, [currentJob, onError]);

  const copyToClipboard = useCallback(async () => {
    if (!currentJob?.result) return;

    try {
      await navigator.clipboard.writeText(currentJob.result);
      alert('Transcription copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      onError('Failed to copy to clipboard');
    }
  }, [currentJob, onError]);

  return {
    cancelJob,
    startNew,
    resetForm,
    downloadTranscription,
    copyToClipboard
  };
};
