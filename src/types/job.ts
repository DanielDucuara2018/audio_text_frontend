// Job status enum matching backend
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Whisper model types
export type WhisperModel = 'tiny' | 'base' | 'small' | 'medium' | 'large-v3' | 'turbo';

// Transcription job interface
export interface TranscriptionJob {
  id: string;
  status: JobStatus;
  filename: string;
  whisperModel: WhisperModel;
  downloadUrl?: string;
  downloadFilename?: string;
  result?: string;
  transcription?: string;
  progress?: number;
  error?: string;
  createdAt?: string;
  completedAt?: string;
  processingTime?: number;
  language?: string;
  languageProbability?: number;
}

// Job history item
export interface JobHistoryItem extends TranscriptionJob {
  timestamp: number;
}
