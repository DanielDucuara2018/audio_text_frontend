import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { connect, ConnectedProps } from 'react-redux';
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
import './AudioTranscription.css';
import { TranscriptionJob, WhisperModel, JobStatus, AppSettings } from '../types';
import { useTranscription, useJobRecovery, useJobActions } from '../hooks';
import { FileUpload } from './AudioTranscription/FileUpload';
import { TranscriptionProgress } from './AudioTranscription/TranscriptionProgress';
import { TranscriptionResults } from './AudioTranscription/TranscriptionResults';
import { DonationSection } from './AudioTranscription/DonationSection';
import { JobHistory } from './AudioTranscription/JobHistory';
import { Header } from './AudioTranscription/Header';
import { FailedState } from './AudioTranscription/FailedState';

// Lazy load EmailModal since it's rarely used
const EmailModal = lazy(() => import('./AudioTranscription/EmailModal').then(module => ({ default: module.EmailModal })));

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

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Use the custom transcription hook
  const transcription = useTranscription({
    whisperModel: settings.whisperModel,
    currentJob,
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

  // Use job recovery hook
  useJobRecovery({
    currentJob,
    onJobUpdate: updateJobStatus,
    onError: setError,
    onClearJob: clearCurrentJob
  });

  // Use job actions hook
  const jobActions = useJobActions({
    currentJob,
    onClearJob: clearCurrentJob,
    onError: setError,
    cancelTranscription: transcription.cancelTranscription,
    resetFile: transcription.resetFile,
    clearError,
    fileInputRef
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

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await transcription.selectFile(file);
  }, [transcription]);

  // Update settings
  const handleSettingsChange = useCallback((key: keyof AppSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  }, [settings, setSettings]);

  // Computed states
  const isProcessing = useMemo(
    () => currentJob && [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(currentJob.status),
    [currentJob]
  );
  const isCompleted = useMemo(
    () => currentJob && currentJob.status === JOB_STATUS.COMPLETED,
    [currentJob]
  );
  const isFailed = useMemo(
    () => currentJob && currentJob.status === JOB_STATUS.FAILED,
    [currentJob]
  );

  // Dark mode toggle handler
  const handleToggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode]);

  // Donation toggle handler
  const handleToggleDonation = useCallback(() => {
    setShowDonation(!showDonation);
  }, [showDonation]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 sm:py-8 px-2 sm:px-4 transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <Header
            darkMode={darkMode}
            onToggleDarkMode={handleToggleDarkMode}
          />

          {/* Donation Section */}
          <DonationSection
            showDonation={showDonation}
            onToggle={handleToggleDonation}
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
              onCancel={jobActions.cancelJob}
            />
          )}

          {/* Results Section */}
          {isCompleted && currentJob && (
            <TranscriptionResults
              currentJob={currentJob}
              onDownload={jobActions.downloadTranscription}
              onCopy={jobActions.copyToClipboard}
              onStartNew={jobActions.startNew}
            />
          )}

          {/* Failed Section */}
          {isFailed && currentJob && (
            <FailedState
              errorMessage={currentJob.error}
              onTryAgain={jobActions.startNew}
            />
          )}

          {/* Job History */}
          <JobHistory
            jobHistory={jobHistory}
            isProcessing={!!isProcessing}
            onViewJob={viewJobResult}
            onRemoveJob={removeJobFromHistory}
          />
        </div>

        {/* Email Modal */}
        {showEmailModal && currentJob && (
          <Suspense fallback={<div className="text-center py-4">Loading...</div>}>
            <EmailModal
              jobId={currentJob.id}
              onClose={() => setShowEmailModal(false)}
              onError={setError}
            />
          </Suspense>
        )}
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
