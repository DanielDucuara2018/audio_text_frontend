import React from 'react';
import { WhisperModel, AppSettings } from '../../types';

interface FileUploadProps {
  selectedFile: File | null;
  audioPreviewUrl: string;
  settings: AppSettings;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onStartTranscription: () => void;
  onSettingsChange: (key: keyof AppSettings, value: any) => void;
}

const WHISPER_MODELS: Array<{ value: WhisperModel; label: string }> = [
  { value: 'tiny', label: 'Tiny' },
  { value: 'base', label: 'Base' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  // { value: 'large-v3', label: 'Large V3' },
  // { value: 'turbo', label: 'Turbo' }
];

export const FileUpload: React.FC<FileUploadProps> = ({
  selectedFile,
  audioPreviewUrl,
  settings,
  isSubmitting,
  fileInputRef,
  onFileSelect,
  onStartTranscription,
  onSettingsChange,
}) => {
  return (
    <div className="upload-section">
      <div className="file-input-wrapper">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac,.mp4,.opus"
          onChange={onFileSelect}
          className="file-input"
          id="audio-file"
          aria-label="Choose audio file for transcription"
          aria-describedby="file-upload-description"
        />
        <label htmlFor="audio-file" className="file-input-label">
          <svg className="upload-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
          Choose Audio File
        </label>
        <p id="file-upload-description" className="sr-only">
          Supported formats: MP3, WAV, M4A, FLAC, OGG, AAC, MP4, OPUS. Maximum file size: 100MB.
        </p>
      </div>

      {selectedFile && (
        <div className="file-preview">
          <div className="file-info">
            <h3>{selectedFile.name}</h3>
            <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}</p>
          </div>
          
          {audioPreviewUrl && (
            <audio 
              controls 
              className="audio-preview"
              aria-label="Preview of selected audio file"
            >
              <source src={audioPreviewUrl} type={selectedFile.type} />
              Your browser does not support the audio element.
            </audio>
          )}

          <div className="settings-section">
            <label className="setting-label" htmlFor="model-select">
              Whisper Model:
              <select
                id="model-select"
                value={settings.whisperModel}
                onChange={(e) => onSettingsChange('whisperModel', e.target.value as WhisperModel)}
                className="model-select"
                aria-label="Select AI transcription model"
                aria-describedby="model-description"
              >
                {WHISPER_MODELS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p id="model-description" className="sr-only">
            Select the AI model for transcription. Larger models are more accurate but slower.
          </p>
          <button
            onClick={onStartTranscription}
            className="transcribe-btn"
            disabled={isSubmitting}
            aria-label="Start audio transcription"
            aria-describedby="transcribe-description"
          >
            {isSubmitting ? 'Starting...' : 'Start Transcription'}
          </button>
          <span id="transcribe-description" className="sr-only">
            Click to begin converting your audio file to text
          </span>
        </div>
      )}
    </div>
  );
};
