// Re-export from job.ts
import type { WhisperModel } from './job';

// App settings interface
export interface AppSettings {
  whisperModel: WhisperModel;
}

// Whisper model option
export interface WhisperModelOption {
  value: WhisperModel;
  label: string;
}

// Re-export WhisperModel for convenience
export type { WhisperModel } from './job';
