import React from 'react';
import { TranscriptionJob, JobStatus } from '../../types';

interface TranscriptionProgressProps {
  currentJob: TranscriptionJob;
  uploadProgress: number;
  onCancel: () => void;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = React.memo(({
  currentJob,
  uploadProgress,
  onCancel,
}) => {
  const isProcessing = currentJob && 
    ['pending', 'processing'].includes(currentJob.status);

  const getStatusMessage = () => {
    switch (currentJob.status) {
      case 'pending' as JobStatus:
        return 'Initializing transcription...';
      case 'processing' as JobStatus:
        return 'Transcribing audio...';
      default:
        return 'Processing...';
    }
  };

  if (!isProcessing) return null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            {currentJob.filename}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Model: <span className="font-medium text-primary-600 dark:text-primary-400">{currentJob.whisperModel}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          className="ml-4 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
                     bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg
                     transition-colors duration-200 border border-red-200 dark:border-red-800"
        >
          Cancel
        </button>
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploading file...</span>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-300 ease-out
                         shadow-lg shadow-primary-500/50"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
           role="status" aria-live="polite" aria-atomic="true">
        <div className="flex items-center gap-4">
          {/* Animated Spinner */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-500 to-secondary-500 animate-spin-slow">
              <div className="absolute inset-2 rounded-full bg-white dark:bg-gray-800"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-pulse-slow" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
              </svg>
            </div>
          </div>

          {/* Status Text */}
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {getStatusMessage()}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentJob.progress !== undefined ? (
                <span className="text-primary-600 dark:text-primary-400 font-medium">Progress: {currentJob.progress}%</span>
              ) : (
                'This may take a few moments...'
              )}
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Processing Time</p>
              <p className="text-sm text-blue-900 dark:text-blue-300 truncate">Depends on file size</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2C17.52,2 22,6.48 22,12C22,17.52 17.52,22 12,22C6.48,22 2,17.52 2,12C2,6.48 6.48,2 12,2M12,20C16.42,20 20,16.42 20,12C20,7.58 16.42,4 12,4C7.58,4 4,7.58 4,12C4,16.42 7.58,20 12,20M11,7H13V13H11V7M11,15H13V17H11V15Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Safe to Leave</p>
              <p className="text-sm text-green-900 dark:text-green-300 truncate">We'll recover your job</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
