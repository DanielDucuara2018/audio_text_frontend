import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import Api from '../Api';
import { TranscriptionJob, WhisperModel, JobStatus } from '../types';
import { useFileUpload } from './useFileUpload';
import { useWebSocket } from './useWebSocket';

interface StartTranscriptionResponse {
  id: string;
}

interface UseTranscriptionOptions {
  whisperModel: WhisperModel;
  onJobCreated: (job: TranscriptionJob) => void;
  onJobUpdated: (jobUpdate: Partial<TranscriptionJob>) => void;
  onError?: (error: string) => void;
  currentJob?: TranscriptionJob | null;
}

export const useTranscription = ({
  whisperModel,
  onJobCreated,
  onJobUpdated,
  onError,
  currentJob
}: UseTranscriptionOptions) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileUpload = useFileUpload({
    onError,
    maxSizeMB: 10
  });

  const webSocket = useWebSocket({
    onJobUpdate: onJobUpdated,
    onError,
    currentJob
  });

  const startTranscription = useCallback(async () => {
    if (!fileUpload.selectedFile || !fileUpload.presignedUrl) {
      if (onError) onError('Please select a file first');
      return;
    }

    if (isSubmitting) {
      return; // Prevent multiple submissions
    }

    try {
      setIsSubmitting(true);
      
      // Upload file first
      const fileUrl = await fileUpload.uploadFile();
      if (!fileUrl) {
        setIsSubmitting(false);
        return;
      }

      // Create transcription job
      const response = await Api.post<StartTranscriptionResponse>('/job/transcribe', {
        filename: fileUpload.selectedFile.name,
        url: fileUrl,
        mode: whisperModel
      });

      const job: TranscriptionJob = {
        id: response.data.id,
        filename: fileUpload.selectedFile.name,
        status: 'pending' as JobStatus,
        whisperModel: whisperModel,
        createdAt: new Date().toISOString()
      };

      onJobCreated(job);
      
      // Start WebSocket connection for real-time updates
      webSocket.connect(job.id);
      
      setIsSubmitting(false);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to start transcription';
      if (onError) onError(errorMessage);
      setIsSubmitting(false);
    }
  }, [
    fileUpload,
    whisperModel,
    isSubmitting,
    onJobCreated,
    onError,
    webSocket
  ]);

  const cancelTranscription = useCallback(() => {
    webSocket.disconnect();
    fileUpload.resetFile();
    setIsSubmitting(false);
  }, [webSocket, fileUpload]);

  return {
    // File upload state
    selectedFile: fileUpload.selectedFile,
    uploadProgress: fileUpload.uploadProgress,
    audioPreviewUrl: fileUpload.audioPreviewUrl,
    isUploading: fileUpload.isUploading,
    
    // File upload actions
    selectFile: fileUpload.selectFile,
    resetFile: fileUpload.resetFile,
    
    // Transcription state
    isSubmitting,
    
    // Transcription actions
    startTranscription,
    cancelTranscription,
    
    // WebSocket state
    isConnected: webSocket.isConnected,
  };
};
