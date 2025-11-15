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
import {
  FileUpload,
  TranscriptionProgress,
  TranscriptionResults,
  EmailModal,
  DonationSection,
} from './AudioTranscription/';

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
    <div className="transcription-container">
      <div className="transcription-card">
        <div className="header">
          <h1>Audio Transcription</h1>
          <p>Convert your audio files to text using AI-powered transcription</p>
        </div>

        {/* Donation Section */}
        <DonationSection 
          showDonation={showDonation}
          onToggle={() => setShowDonation(!showDonation)}
        />

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={clearError} className="error-close">×</button>
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
          <div className="failed-section">
            <h3>Transcription Failed</h3>
            <p className="error-details">{currentJob.error || 'Unknown error occurred'}</p>
            <button onClick={startNew} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Job History */}
        {jobHistory.length > 0 && !isProcessing && (
          <div className="history-section">
            <h3>Recent Jobs</h3>
            <div className="history-list">
              {jobHistory.slice(0, 10).map((job: TranscriptionJob) => (
                <div key={job.id} className="history-item">
                  <div className="history-info">
                    <span className="history-filename">{job.filename}</span>
                    <span className={`history-status status-${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span className="history-date">
                      {new Date(job.completedAt || job.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                    <div className="history-actions">
                      {job.status === JOB_STATUS.COMPLETED && job.result && (
                        <button
                          onClick={() => handleViewJob(job)}
                          className="history-view-btn"
                          title="View result"
                        >
                          👁️
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveJob(job.id)}
                        className="history-remove-btn"
                        title="Remove from history"
                      >
                        🗑️
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
