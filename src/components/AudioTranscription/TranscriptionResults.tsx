import React from 'react';
import { TranscriptionJob } from '../../types';

interface TranscriptionResultsProps {
  currentJob: TranscriptionJob;
  onDownload: () => void;
  onCopy: () => void;
  onEmail: () => void;
  onStartNew: () => void;
}

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = React.memo(({
  currentJob,
  onDownload,
  onCopy,
  onEmail,
  onStartNew,
}) => {
  const isCompleted = currentJob && currentJob.status === 'completed';

  if (!isCompleted) return null;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
                      rounded-xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Transcription Complete!
            </h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                <span className="font-medium">Model: <span className="text-primary-600 dark:text-primary-400">{currentJob.whisperModel}</span></span>
              </div>
              {currentJob.processingTime && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z" />
                  </svg>
                  <span className="font-medium">Time: <span className="text-green-600 dark:text-green-400">{currentJob.processingTime.toFixed(1)}s</span></span>
                </div>
              )}
              {currentJob.language && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.58L4,19L9,14L12.11,17.11L12.87,15.07M18.5,10H16.5L12,22H14L15.12,19H19.87L21,22H23L18.5,10M15.88,17L17.5,12.67L19.12,17H15.88Z" />
                  </svg>
                  <span className="font-medium">Language: <span className="text-blue-600 dark:text-blue-400">{currentJob.language.toUpperCase()}</span>
                    {currentJob.languageProbability && ` (${(currentJob.languageProbability * 100).toFixed(0)}%)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transcription Result */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-5 py-3 border-b border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transcription</h4>
        </div>
        <div className="p-5">
          <textarea
            value={currentJob.result || ''}
            readOnly
            className="w-full h-64 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700
                       bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       font-mono text-sm leading-relaxed resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Transcription will appear here..."
            aria-label="Transcription result"
            aria-describedby="result-description"
          />
          <span id="result-description" className="sr-only">
            Your audio has been transcribed. Use the buttons below to download, copy, or share the text.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" role="group" aria-label="Transcription actions">
        <button 
          onClick={onDownload} 
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white 
                     font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200
                     transform hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Download transcription as text file"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
          </svg>
          Download
        </button>

        <button 
          onClick={onCopy} 
          className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white 
                     font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200
                     transform hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Copy transcription to clipboard"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
          </svg>
          Copy Text
        </button>

        <button
          onClick={onEmail}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white 
                     font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200
                     transform hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Send transcription by email"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
          </svg>
          Email
        </button>

        <button 
          onClick={onStartNew} 
          className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 
                     text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200
                     transform hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Start new transcription with different file"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,18V14H9V16.11C10.27,17.55 12.31,17.85 14.11,17.11C15.82,16.39 16.85,14.68 16.85,13C16.85,11.11 15.54,9.4 13.7,8.88C11.86,8.37 9.91,9.08 8.83,10.67L7.1,9.68C8.64,7.5 11.38,6.5 13.91,7.28C16.43,8.05 18.25,10.29 18.27,13C18.29,15.88 16.25,18.32 13.45,18.93C11.79,19.28 10.09,18.8 8.83,17.67L9,18H7Z" />
          </svg>
          New File
        </button>
      </div>
    </div>
  );
});
