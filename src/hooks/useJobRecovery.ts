import { useEffect, useRef } from 'react';
import { TranscriptionJob, JobStatus } from '../types';
import Api from '../Api';
import { AxiosError } from 'axios';

interface UseJobRecoveryProps {
  currentJob: TranscriptionJob | null;
  onJobUpdate: (jobUpdate: Partial<TranscriptionJob>) => void;
  onError: (error: string) => void;
  onClearJob: () => void;
  onReconnectWebSocket?: (jobId: string) => void;
}

const JOB_STATUS: Record<string, JobStatus> = {
  PENDING: 'pending' as JobStatus,
  PROCESSING: 'processing' as JobStatus,
  COMPLETED: 'completed' as JobStatus,
  FAILED: 'failed' as JobStatus
};

export const useJobRecovery = ({
  currentJob,
  onJobUpdate,
  onError,
  onClearJob,
  onReconnectWebSocket
}: UseJobRecoveryProps) => {
  const isRecoveringRef = useRef<boolean>(false);

  useEffect(() => {
    const recoverJob = async () => {
      if (!currentJob || isRecoveringRef.current) return;

      const needsRecovery = currentJob && [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(currentJob.status);
      if (!needsRecovery) return;

      isRecoveringRef.current = true;
      console.log('Attempting to recover job:', currentJob.id);

      try {
        const response = await Api.get(`/job/status/${currentJob.id}`);
        const jobData = response.data;

        const updatedJob: Partial<TranscriptionJob> = {
          id: currentJob.id,
          status: jobData.status as JobStatus,
          result: jobData.result_text,
          error: jobData.error_message,
          processingTime: jobData.processing_time_seconds,
          language: jobData.language,
          languageProbability: jobData.language_probability,
          whisperModel: jobData.whisper_model,
        };

        if (jobData.status === JOB_STATUS.COMPLETED || jobData.status === JOB_STATUS.FAILED) {
          updatedJob.completedAt = jobData.update_date || new Date().toISOString();
        }

        onJobUpdate(updatedJob);

        if (jobData.status === JOB_STATUS.PENDING || jobData.status === JOB_STATUS.PROCESSING) {
          console.log('Job still processing, reconnecting WebSocket...');
          onReconnectWebSocket?.(currentJob.id);
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        console.error('Failed to recover job:', axiosError);
        onError('Failed to recover job. Please start a new transcription.');
        onClearJob();
      } finally {
        isRecoveringRef.current = false;
      }
    };

    recoverJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount
};
