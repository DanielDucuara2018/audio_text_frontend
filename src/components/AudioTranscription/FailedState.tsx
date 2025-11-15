import React from 'react';

interface FailedStateProps {
  errorMessage?: string;
  onTryAgain: () => void;
}

export const FailedState: React.FC<FailedStateProps> = ({ errorMessage, onTryAgain }) => {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center space-y-4 animate-slide-up">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 mb-2">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">Transcription Failed</h3>
      <p className="text-red-700 dark:text-red-300 max-w-md mx-auto">
        {errorMessage || 'Unknown error occurred'}
      </p>
      <button
        onClick={onTryAgain}
        className="mt-4 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl
                   font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300
                   dark:from-red-600 dark:to-red-700"
      >
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z" />
          </svg>
          Try Again
        </span>
      </button>
    </div>
  );
};
