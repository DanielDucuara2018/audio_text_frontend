import { useState, useEffect, useCallback, useRef } from 'react';
import { connect } from 'react-redux';
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
import axios from 'axios';
import './AudioTranscription.css';

// Job status constants matching backend
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing', 
  COMPLETED: 'completed',
  FAILED: 'failed'
};

const WHISPER_MODELS = [
  { value: 'tiny', label: 'Tiny (fastest, less accurate)' },
  { value: 'base', label: 'Base (balanced)' },
  { value: 'small', label: 'Small (good quality)' },
  { value: 'medium', label: 'Medium (better quality)' },
  { value: 'large', label: 'Large (best quality, slowest)' }
];

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
}) => {
  // Local state for UI
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState('');
  
  // Refs for cleanup
  const websocketRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/ogg', 'audio/aac'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|flac|ogg|aac)$/i)) {
      setError('Please select a valid audio file (MP3, WAV, M4A, FLAC, OGG, AAC)');
      return;
    }

    // Validate file size (10MB limit based on backend config)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    clearError();
    setSelectedFile(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(previewUrl);

    try {
      // Get presigned URL for upload
      const response = await Api.get('/audio/get_presigned_url', {
        params: {
          filename: file.name,
          content_type: file.type,
          file_size: file.size
        }
      });
      
      setPresignedUrl(response.data.url);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to prepare file upload');
    }
  };

  // Upload file to S3
  const uploadFile = async () => {
    if (!selectedFile || !presignedUrl) return null;

    try {
      setUploadProgress(0);
      
      // Upload directly to S3 using presigned URL
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      return presignedUrl;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to upload file');
    }
  };

  // Start transcription process
  const startTranscription = async () => {
    if (!selectedFile || !presignedUrl) {
      setError('Please select a file first');
      return;
    }

    try {
      clearError();
      
      // Upload file first
      const fileUrl = await uploadFile();
      if (!fileUrl) return;

      // Create transcription job
      const response = await Api.post('/job/transcribe', {
        filename: selectedFile.name,
        url: fileUrl,
        mode: settings.whisperModel
      });

      const job = {
        id: response.data.id,
        filename: selectedFile.name,
        status: JOB_STATUS.PENDING,
        whisperModel: settings.whisperModel,
        createdAt: new Date().toISOString(),
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      };

      setCurrentJob(job);
      addJobToHistory(job);
      
      // Start WebSocket connection for real-time updates
      connectWebSocket(job.id);
      
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to start transcription');
    }
  };

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback((jobId) => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    const wsUrl = `ws://localhost:3203/api/v1/job/ws/${jobId}`;
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for job:', jobId);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'job_update') {
        // Create updated job using jobId instead of stale currentJob
        const baseJobUpdate = {
          id: jobId,
          status: data.status,
          result: data.result,
          error: data.message,
          processingTime: data.processing_time,
          updatedAt: new Date().toISOString()
        };

        if (data.status === JOB_STATUS.COMPLETED) {            
            // Create downloadable blob
            const blob = new Blob([data.result], { type: 'text/plain' });
            const downloadUrl = URL.createObjectURL(blob);
            
            const completedJob = {
                ...baseJobUpdate,
                downloadUrl,
                downloadFilename: `${selectedFile?.name || 'transcription'}_transcription.txt`
            };
            
            console.log(completedJob)
            updateJobStatus(completedJob);
            ws.close();
        } else if (data.status === JOB_STATUS.FAILED) {
            updateJobStatus(baseJobUpdate);
            setError(data.message || 'Transcription failed');
            ws.close();
        } else {
            // For PENDING or PROCESSING status
            updateJobStatus(baseJobUpdate);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Please try again.');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }, [updateJobStatus, selectedFile, setError]);

  // Cancel current job
  const cancelJob = () => {
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    clearCurrentJob();
    resetForm();
  };

  // Reset form to initial state
  const resetForm = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setPresignedUrl(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl('');
    }
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
  const handleSettingsChange = (key, value) => {
    setSettings({
      ...settings,
      [key]: value
    });
  };

  // Download transcription
  const downloadTranscription = () => {
    if (currentJob?.downloadUrl && currentJob?.downloadFilename) {
      const link = document.createElement('a');
      link.href = currentJob.downloadUrl;
      link.download = currentJob.downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Remove job from history
  const handleRemoveJob = (jobId) => {
    removeJobFromHistory(jobId);
  };

  // View job result
  const handleViewJob = (job) => {
    if (job.status === JOB_STATUS.COMPLETED && job.result) {
      viewJobResult(job);
    }
  };

  const isProcessing = currentJob && [JOB_STATUS.PENDING, JOB_STATUS.PROCESSING].includes(currentJob.status);
  const isCompleted = currentJob?.status === JOB_STATUS.COMPLETED;
  const isFailed = currentJob?.status === JOB_STATUS.FAILED;

  return (
    <div className="transcription-container">
      <div className="transcription-card">
        <div className="header">
          <h1>Audio Transcription</h1>
          <p>Convert your audio files to text using AI-powered transcription</p>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={clearError} className="error-close">×</button>
          </div>
        )}

        {/* File Upload Section */}
        {!currentJob && (
          <div className="upload-section">
            <div className="file-input-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="file-input"
                id="audio-file"
              />
              <label htmlFor="audio-file" className="file-input-label">
                <svg className="upload-icon" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Choose Audio File
              </label>
            </div>

            {selectedFile && (
              <div className="file-preview">
                <div className="file-info">
                  <h3>{selectedFile.name}</h3>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}</p>
                </div>
                
                {audioPreviewUrl && (
                  <audio controls className="audio-preview">
                    <source src={audioPreviewUrl} type={selectedFile.type} />
                    Your browser does not support the audio element.
                  </audio>
                )}

                <div className="settings-section">
                  <label className="setting-label">
                    Whisper Model:
                    <select
                      value={settings.whisperModel}
                      onChange={(e) => handleSettingsChange('whisperModel', e.target.value)}
                      className="model-select"
                    >
                      {WHISPER_MODELS.map(model => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button onClick={startTranscription} className="transcribe-btn">
                  Start Transcription
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing Section */}
        {isProcessing && (
          <div className="processing-section">
            <div className="processing-header">
              <h3>Processing: {currentJob.filename}</h3>
              <button onClick={cancelJob} className="cancel-btn">Cancel</button>
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

            <div className="status-section">
              <div className="status-indicator">
                <div className="spinner"></div>
                <span className="status-text">
                  {currentJob.status === JOB_STATUS.PENDING ? 'Preparing...' : 'Transcribing...'}
                </span>
              </div>
              <p className="model-info">Using {currentJob.whisperModel} model</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {isCompleted && (
          <div className="results-section">
            <div className="results-header">
              <h3>Transcription Complete</h3>
              <div className="results-meta">
                <span>Model: {currentJob.whisperModel}</span>
                {currentJob.processingTime && (
                  <span>Time: {currentJob.processingTime}s</span>
                )}
              </div>
            </div>

            <div className="transcription-result">
              <textarea 
                value={currentJob.result || ''} 
                readOnly 
                className="result-textarea"
                placeholder="Transcription will appear here..."
              />
            </div>

            <div className="results-actions">
              <button onClick={downloadTranscription} className="download-btn">
                Download Transcription
              </button>
              <button onClick={startNew} className="new-btn">
                Transcribe New File
              </button>
            </div>
          </div>
        )}

        {/* Failed Section */}
        {isFailed && (
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
              {jobHistory.slice(0, 10).map(job => (
                <div key={job.id} className="history-item">
                  <div className="history-info">
                    <span className="history-filename">{job.filename}</span>
                    <span className={`history-status status-${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="history-meta">
                    <span className="history-date">
                      {new Date(job.updatedAt).toLocaleDateString()}
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

const mapStateToProps = (state) => ({
  currentJob: state.currentJob,
  jobHistory: state.jobs || [],
  settings: state.settings || { whisperModel: 'base' },
  error: state.error
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

export default connect(mapStateToProps, mapDispatchToProps)(AudioTranscription);