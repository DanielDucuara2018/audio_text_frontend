import React, { useState, useEffect, useRef } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AxiosError } from 'axios';
import {
  setCurrentJob,
  addJobToHistory,
  updateJobStatus,
  setSettings,
  clearCurrentJob,
  setError,
  clearError,
  removeJobFromHistory,
  viewJobResult,
} from '../actions/appActions';
import Api from '../Api';
import './AudioTranscription.css';
import { TranscriptionJob, WhisperModel, JobStatus, AppSettings } from '../types';
import { useTranscription } from '../hooks';
import { FileUpload } from './AudioTranscription/FileUpload';
import { TranscriptionProgress } from './AudioTranscription/TranscriptionProgress';
import { TranscriptionResults } from './AudioTranscription/TranscriptionResults';
import { EmailModal } from './AudioTranscription/EmailModal';
import { DonationSection } from './AudioTranscription/DonationSection';

// Job status constants matching backend
const JOB_STATUS: Record<string, JobStatus> = {
  PENDING: 'pending' as JobStatus,
  PROCESSING: 'processing' as JobStatus, 
  COMPLETED: 'completed' as JobStatus,
  FAILED: 'failed' as JobStatus
};

type PropsFromRedux = ConnectedProps<typeof connector>;

const AudioTranscription = ({
  currentJob,
  jobHistory,
  settings,
  error,
  setCurrentJob,
  addJobToHistory,
  updateJobStatus,
  setSettings,
  clearCurrentJob,
  setError,
  clearError,
  removeJobFromHistory,
  viewJobResult
}: PropsFromRedux) => {
  // Local state for UI
  const [showDonation, setShowDonation] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Refs for cleanup
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRecoveringRef = useRef<boolean>(false);

  // Use the custom transcription hook
  const transcription = useTranscription({
    whisperModel: settings.whisperModel,
    onJobCreated: (job: TranscriptionJob) => {
      setCurrentJob(job);
      addJobToHistory(job);
    },
    onJobUpdated: (jobUpdate: Partial<TranscriptionJob>) => {
      updateJobStatus(jobUpdate);
    },
    onError: (errorMessage: string) => {
      setError(errorMessage);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcription.audioPreviewUrl) {
        URL.revokeObjectURL(transcription.audioPreviewUrl);
      }
    };
  }, [transcription.audioPreviewUrl]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Warn user before leaving page during processing
  useEffect(() => {
    const isProcessing = currentJob && [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(currentJob?.status);
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Transcription in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    if (isProcessing) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [currentJob]);

  // Attempt to recover job on mount if one exists in Redux
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
          status: jobData.status,
          result: jobData.result,
          processingTime: jobData.processing_time,
          language: jobData.language,
          languageProbability: jobData.language_probability,
          downloadUrl: jobData.download_url || '',
          downloadFilename: jobData.download_filename || `${currentJob.filename}_transcription.txt`,
        };

        if (jobData.status === JOB_STATUS.COMPLETED || jobData.status === JOB_STATUS.FAILED) {
          updatedJob.completedAt = new Date().toISOString();
        }

        updateJobStatus(updatedJob);

        if (jobData.status === JOB_STATUS.PENDING || jobData.status === JOB_STATUS.PROCESSING) {
          console.log('Job still processing, reconnecting WebSocket...');
          // WebSocket reconnection is handled by useTranscription hook
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        console.error('Failed to recover job:', axiosError);
        setError('Failed to recover job. Please start a new transcription.');
        clearCurrentJob();
      } finally {
        isRecoveringRef.current = false;
      }
    };

    recoverJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    await transcription.selectFile(file);
  };

  // Cancel job
  const cancelJob = () => {
    if (currentJob) {
      console.log('Cancelling job:', currentJob.id);
    }
    transcription.cancelTranscription();
    clearCurrentJob();
    resetForm();
  };

  // Reset form to initial state
  const resetForm = () => {
    transcription.resetFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearError();
  };

  // Start new transcription
  const startNew = () => {
    cancelJob();
    resetForm();
  };

  // Update settings
  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  // Download transcription
  const downloadTranscription = async () => {
    if (!currentJob?.result) return;

    const filename = currentJob.downloadFilename || `${currentJob.filename}_transcription.txt`;
    const text = currentJob.result;

    // Check if we're on a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Try Web Share API first (mobile devices)
    if (isMobile && navigator.share && navigator.canShare) {
      try {
        const file = new File([text], filename, { type: 'text/plain' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Audio Transcription',
            text: 'Transcription from VoiceIA'
          });
          return;
        }
      } catch (error) {
        console.log('Share failed or cancelled:', error);
      }
    }

    // Traditional download method
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        link.target = '_blank';
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download. Please try the email option instead.');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!currentJob?.result) return;

    try {
      await navigator.clipboard.writeText(currentJob.result);
      alert('Transcription copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy to clipboard');
    }
  };

  // Handle view job from history
  const handleViewJob = (job: TranscriptionJob) => {
    viewJobResult(job);
  };

  // Handle remove job from history
  const handleRemoveJob = (jobId: string) => {
    removeJobFromHistory(jobId);
  };

  // Computed states
  const isProcessing = currentJob && [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(currentJob.status);
  const isCompleted = currentJob && currentJob.status === JOB_STATUS.COMPLETED;
  const isFailed = currentJob && currentJob.status === JOB_STATUS.FAILED;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 sm:py-8 px-2 sm:px-4 transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-3 sm:mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 sm:p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl
                       transition-all duration-300 hover:scale-110 active:scale-95
                       border border-gray-200 dark:border-gray-700"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z" />
              </svg>
            )}
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 mb-3 sm:mb-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
              VoiceIA
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
              AI-powered audio to text transcription
            </p>
          </div>

        {/* Donation Section */}
        <DonationSection 
          showDonation={showDonation}
          onToggle={() => setShowDonation(!showDonation)}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-lg animate-slide-down">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                <span className="text-red-800 dark:text-red-200 font-medium">{error}</span>
              </div>
              <button 
                onClick={clearError} 
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {!currentJob && (
          <FileUpload
            selectedFile={transcription.selectedFile}
            audioPreviewUrl={transcription.audioPreviewUrl}
            settings={settings}
            isSubmitting={transcription.isSubmitting}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onStartTranscription={transcription.startTranscription}
            onSettingsChange={handleSettingsChange}
          />
        )}

        {/* Processing Section */}
        {isProcessing && currentJob && (
          <TranscriptionProgress
            currentJob={currentJob}
            uploadProgress={transcription.uploadProgress}
            onCancel={cancelJob}
          />
        )}

        {/* Results Section */}
        {isCompleted && currentJob && (
          <TranscriptionResults
            currentJob={currentJob}
            onDownload={downloadTranscription}
            onCopy={copyToClipboard}
            onStartNew={startNew}
          />
        )}

        {/* Email Modal */}
        {showEmailModal && currentJob && (
          <EmailModal
            jobId={currentJob.id}
            onClose={() => setShowEmailModal(false)}
            onError={setError}
          />
        )}

        {/* Failed Section */}
        {isFailed && currentJob && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 text-center space-y-4 animate-slide-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 mb-2">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">Transcription Failed</h3>
            <p className="text-red-700 dark:text-red-300 max-w-md mx-auto">
              {currentJob.error || 'Unknown error occurred'}
            </p>
            <button 
              onClick={startNew} 
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
        )}

        {/* Job History */}
        {jobHistory.length > 0 && !isProcessing && (
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3" />
              </svg>
              Recent Jobs
            </h3>
            <div className="grid gap-3 sm:gap-4">
              {jobHistory.slice(0, 10).map((job: TranscriptionJob) => (
                <div 
                  key={job.id} 
                  className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 
                             rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-600"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
                        </svg>
                        <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                          {job.filename}
                        </span>
                        <span 
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0
                            ${job.status === JOB_STATUS.COMPLETED ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                            ${job.status === JOB_STATUS.PROCESSING ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                            ${job.status === JOB_STATUS.FAILED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                            ${job.status === JOB_STATUS.PENDING ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H17M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M9,14V16H7V14H9M13,14V16H11V14H13M17,14V16H15V14H17Z" />
                          </svg>
                          {new Date(job.completedAt || job.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === JOB_STATUS.COMPLETED && job.result && (
                        <button
                          onClick={() => handleViewJob(job)}
                          className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 
                                     hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                          title="View result"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveJob(job.id)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 
                                   hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-200"
                        title="Remove from history"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

interface RootState {
  currentJob: TranscriptionJob | null;
  jobs: TranscriptionJob[];
  settings: AppSettings;
  error: string | null;
}

const mapStateToProps = (state: RootState) => ({
  currentJob: state.currentJob,
  jobHistory: state.jobs || [],
  settings: state.settings || { whisperModel: 'base' as WhisperModel },
  error: state.error || null
});

const mapDispatchToProps = {
  setCurrentJob,
  addJobToHistory,
  updateJobStatus,
  setSettings,
  clearCurrentJob,
  setError,
  clearError,
  removeJobFromHistory,
  viewJobResult
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(AudioTranscription);
