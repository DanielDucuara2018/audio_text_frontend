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

const WHISPER_MODELS: Array<{ value: WhisperModel; label: string; description: string }> = [
  { value: 'tiny', label: 'Tiny', description: 'Fastest, basic accuracy' },
  { value: 'base', label: 'Base', description: 'Fast, good accuracy' },
  { value: 'small', label: 'Small', description: 'Balanced speed & quality' },
  { value: 'medium', label: 'Medium', description: 'Slower, high accuracy' },
  { value: 'large-v3', label: 'Large V3', description: 'Best accuracy, slowest' },
  // { value: 'turbo', label: 'Turbo', description: 'Fast, optimized' }
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
    <div className="space-y-6 animate-slide-up">
      {/* File Upload Area */}
      <div className="relative group">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac,.mp4,.opus"
          onChange={onFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id="audio-file"
          aria-label="Choose audio file for transcription"
          aria-describedby="file-upload-description"
        />
        <label 
          htmlFor="audio-file" 
          className="flex flex-col items-center justify-center px-8 py-12 border-3 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl 
                     bg-gradient-to-br from-primary-50/50 to-secondary-50/50 dark:from-primary-900/10 dark:to-secondary-900/10
                     group-hover:border-primary-400 dark:group-hover:border-primary-500 group-hover:bg-primary-50/70 dark:group-hover:bg-primary-900/20
                     transition-all duration-300 cursor-pointer"
        >
          <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center
                          group-hover:scale-110 transition-transform duration-300 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Choose Audio File</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            MP3, WAV, M4A, FLAC, OGG, AAC, MP4, OPUS
          </p>
        </label>
        <p id="file-upload-description" className="sr-only">
          Supported formats: MP3, WAV, M4A, FLAC, OGG, AAC, MP4, OPUS. Maximum file size: 100MB.
        </p>
      </div>

      {/* File Preview & Settings */}
      {selectedFile && (
        <div className="space-y-5 animate-slide-down">
          {/* File Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 
                              flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,3.23V7H17.77M12,2A2,2 0 0,1 14,4V8A2,2 0 0,1 12,10H8A2,2 0 0,1 6,8V4A2,2 0 0,1 8,2M6,12A2,2 0 0,1 8,10H12A2,2 0 0,1 14,12V20A2,2 0 0,1 12,22H8A2,2 0 0,1 6,20Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedFile.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1]?.toUpperCase() || 'Audio'}
                </p>
              </div>
            </div>

            {/* Audio Player */}
            {audioPreviewUrl && (
              <div className="mt-4">
                <audio
                  controls
                  className="w-full h-12 rounded-lg"
                  aria-label="Preview of selected audio file"
                >
                  <source src={audioPreviewUrl} type={selectedFile.type} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
            <label className="block" htmlFor="model-select">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z" />
                </svg>
                <span className="font-semibold text-gray-700 dark:text-gray-200">AI Model</span>
              </div>
              <select
                id="model-select"
                value={settings.whisperModel}
                onChange={(e) => onSettingsChange('whisperModel', e.target.value as WhisperModel)}
                className="input-field"
                aria-label="Select AI transcription model"
                aria-describedby="model-description"
              >
                {WHISPER_MODELS.map(model => (
                  <option key={model.value} value={model.value}>
                    {model.label} - {model.description}
                  </option>
                ))}
              </select>
            </label>
            <p id="model-description" className="sr-only">
              Select the AI model for transcription. Larger models are more accurate but slower.
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={onStartTranscription}
            disabled={isSubmitting}
            className="btn-primary w-full group relative overflow-hidden"
            aria-label="Start audio transcription"
            aria-describedby="transcribe-description"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting Transcription...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                  </svg>
                  Start Transcription
                </>
              )}
            </span>
            <span id="transcribe-description" className="sr-only">
              Click to begin converting your audio file to text
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
