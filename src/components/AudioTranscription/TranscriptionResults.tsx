import React from 'react';
import { TranscriptionJob } from '../../types';

interface TranscriptionResultsProps {
  currentJob: TranscriptionJob;
  onDownload: () => void;
  onCopy: () => void;
  onStartNew: () => void;
}

export const TranscriptionResults: React.FC<TranscriptionResultsProps> = ({
  currentJob,
  onDownload,
  onCopy,
  onStartNew,
}) => {
  const isCompleted = currentJob && currentJob.status === 'completed';

  if (!isCompleted) return null;

  return (
    <div className="results-section">
      <div className="results-header">
        <h3>Transcription Complete</h3>
        <div className="results-meta">
          <span>Model: {currentJob.whisperModel}</span>
          {currentJob.processingTime && (
            <span>Time: {currentJob.processingTime.toFixed(1)}s</span>
          )}
          {currentJob.language && (
            <span>Language: {currentJob.language.toUpperCase()}
              {currentJob.languageProbability &&
                ` (${(currentJob.languageProbability * 100).toFixed(0)}%)`
              }
            </span>
          )}
        </div>
      </div>

      <div className="transcription-result">
        <textarea 
          value={currentJob.result || ''} 
          readOnly 
          className="result-textarea"
          placeholder="Transcription will appear here..."
          aria-label="Transcription result"
          aria-describedby="result-description"
        />
        <span id="result-description" className="sr-only">
          Your audio has been transcribed. Use the buttons below to download, copy, or share the text.
        </span>
      </div>

      <div className="results-actions" role="group" aria-label="Transcription actions">
        <button 
          onClick={onDownload} 
          className="download-btn"
          aria-label="Download transcription as text file"
        >
          📥 Download
        </button>
        <button 
          onClick={onCopy} 
          className="copy-text-btn"
          aria-label="Copy transcription to clipboard"
        >
          📋 Copy Text
        </button>
        {/* Email functionality commented out per original code
        <button onClick={onEmail} className="email-btn">
          📧 Send by Email
        </button>
        */}
        <button 
          onClick={onStartNew} 
          className="new-btn"
          aria-label="Start new transcription with different file"
        >
          Transcribe New File
        </button>
      </div>
    </div>
  );
};
