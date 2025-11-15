import React from 'react';
import { TranscriptionJob, JobStatus } from '../../types';

interface TranscriptionProgressProps {
  currentJob: TranscriptionJob;
  uploadProgress: number;
  onCancel: () => void;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({
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
    <div className="processing-section">
      <div className="processing-header">
        <h3>Processing: {currentJob.filename}</h3>
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
      </div>
      
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="progress-section">
          <p>Uploading file...</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">{uploadProgress}%</span>
        </div>
      )}

      <div className="status-section" role="status" aria-live="polite" aria-atomic="true">
        <div className="status-indicator">
          <div className="spinner" aria-hidden="true"></div>
          <span className="status-text">
            {getStatusMessage()}
          </span>
        </div>
        <p className="status-description">
          Model: {currentJob.whisperModel} 
          {currentJob.progress !== undefined && ` • Progress: ${currentJob.progress}%`}
        </p>
      </div>

      <div className="processing-info">
        <p className="info-text">
          ⏱️ This may take a few moments depending on file size and selected model
        </p>
        <p className="info-text">
          🔄 You can safely leave this page - we'll recover your job when you return
        </p>
      </div>
    </div>
  );
};
