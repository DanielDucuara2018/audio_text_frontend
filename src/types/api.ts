import { WhisperModel } from './job';

// API Response types

export interface PresignedUrlResponse {
  job_id: string;
  presigned_url: string;
  s3_key: string;
}

export interface StartTranscriptionResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatusResponse {
  id: string;
  status: string;
  filename: string;
  whisper_model: WhisperModel;
  download_url?: string;
  download_filename?: string;
  result?: string;
  error?: string;
  created_at?: string;
  completed_at?: string;
  processing_time?: number;
  language?: string;
  language_probability?: number;
}

export interface EmailTranscriptionRequest {
  id: string;
  email: string;
}

export interface EmailTranscriptionResponse {
  success: boolean;
  message: string;
}

// WebSocket message types

export interface WebSocketMessage {
  type: 'job_update' | 'error' | 'ping';
  data?: JobUpdateData | ErrorData;
}

export interface JobUpdateData {
  job_id: string;
  status: string;
  progress?: number;
  result?: string;
  error?: string;
  download_url?: string;
  download_filename?: string;
  processing_time?: number;
  language?: string;
  language_probability?: number;
}

export interface ErrorData {
  message: string;
  code?: string;
}

// File upload types

export interface UploadConfig {
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
  headers?: Record<string, string>;
}
