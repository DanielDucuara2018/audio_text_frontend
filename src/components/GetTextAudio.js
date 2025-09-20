import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  setSelectedFile,
  setSelectedFilename,
  setUploadedFile,
  setTranscription,
  setTranscriptionFilename,
  setPidProcess,
  setDownloadableText,
  setErrorUploading,
  setErrorTranscribing,
  setIsUploading,
  setIsProcessing,
  setAccuracyMode,
  clearState,
} from '../actions/appActions';
import Api from '../Api';
import axios from 'axios';
import './GetTextAudio.css';

class GetTextAudio extends Component {
  constructor(props) {
    super(props);
    this.fileCheckInterval = null;
    this.websocket = null;
    this.state = {
      audioPreviewUrl: '',
      isFileUploaded: false,
      uploadUrl: '',
    };

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleTranscription = this.handleTranscription.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.clearAllState = this.clearAllState.bind(this);
  }

  componentWillUnmount() {
    if (this.props.downloadableText) {
      window.URL.revokeObjectURL(this.props.downloadableText);
    }
    if (this.fileCheckInterval) {
      clearInterval(this.fileCheckInterval);
    }
    if (this.websocket) {
      this.websocket.close();
    }
  }

  handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.props.setIsUploading(true);
      this.props.setErrorUploading(null);
      this.setState({ isFileUploaded: false, audioPreviewUrl: '' });

      // 1. Get presigned URL from backend
      const upload_response = await Api.get("/audio/get_presigned_url", {
        params: {
          filename: file.name,
          content_type: file.type,
          file_size: file.size
        }
      });

      const upload_url = upload_response.data.url;

      // 2. Upload file directly to S3 using presigned URL
      await axios.put(upload_url, file, {
        headers: { "Content-Type": file.type },
      });

      // 3. Create CloudFront URL for audio preview
      const cloudFrontUrl = `https://d3skpo6i31hl4s.cloudfront.net/${file.name}`;

      // 4. Set file as uploaded and ready for transcription
      this.props.setSelectedFile(file);
      this.props.setSelectedFilename(file.name);
      this.props.setUploadedFile(file.name);
      this.props.setIsUploading(false);
      this.setState({ 
        isFileUploaded: true,
        audioPreviewUrl: cloudFrontUrl,
        uploadUrl: upload_url  // Store upload URL for transcription
      });

    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Error uploading file. Please try again.';
      this.props.setErrorUploading(errorMessage);
      this.props.setIsUploading(false);
      this.setState({ isFileUploaded: false, audioPreviewUrl: '', uploadUrl: '' });
    }
  }

  handleModeChange(event) {
    this.props.setAccuracyMode(event.target.value);
  }

  handleTranscription() {
    const { uploadedFile, accuracyMode } = this.props;
    const { uploadUrl } = this.state;
    
    if (!uploadedFile || !uploadUrl) {
      this.props.setErrorTranscribing('No audio file uploaded.');
      return;
    }

    this.props.setIsProcessing(true);
    this.props.setErrorTranscribing(null);

    Api.post('/job/transcribe', { 
      filename: uploadedFile, 
      mode: accuracyMode,
      url: uploadUrl
    })
      .then((response) => {
        const jobId = response.data.id;
        this.props.setPidProcess(jobId);
        this.getTranscriptionData(jobId);
        localStorage.setItem('job_id', jobId);
      })
      .catch((error) => {
        const errorMessage = error.response?.data?.detail || 'Error starting transcription. Please try again.';
        this.props.setErrorTranscribing(errorMessage);
        this.props.setIsProcessing(false);
      });
  }

  getTranscriptionData = (jobId) => {
    // Use WebSocket instead of polling
    const wsUrl = `ws://localhost:3203/api/v1/job/ws/${jobId}`;
    this.websocket = new WebSocket(wsUrl);

    this.websocket.onopen = () => {
      console.log('WebSocket connected for job:', jobId);
    };

    this.websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      if (data.type === 'job_update') {
        const { status, result, message } = data;
        console.log('Vars:', status, result, message);
        if (status === 'completed' && result) {
          this.props.setTranscription(result);
          this.props.setIsProcessing(false);
          this.props.setPidProcess(null);
          this.props.setDownloadableText(
            URL.createObjectURL(new Blob([result], { type: 'text/plain' }))
          );
          this.props.setTranscriptionFilename(`${this.props.selectedFile.name}.txt`);
          this.websocket.close();
        } else if (status === 'failed') {
          this.props.setErrorTranscribing(message || 'Transcription failed');
          this.props.setIsProcessing(false);
          this.websocket.close();
        }
        // If status is 'pending' or 'processing', keep listening
      }
    };

    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.props.setErrorTranscribing('Connection error. Please try again.');
      this.props.setIsProcessing(false);
    };

    this.websocket.onclose = () => {
      console.log('WebSocket connection closed for job:', jobId);
    };
  };

  terminateTranscription = (jobId) => {
    // Close WebSocket connection
    if (this.websocket) {
      this.websocket.close();
    }
    console.log('Job cancellation not implemented yet:', jobId);
    localStorage.clear();
  };

  clearAllState() {
    const pid = this.props.pidProcess;
    if (pid) {
      this.terminateTranscription(pid);
    }
    if (this.fileCheckInterval) {
      clearInterval(this.fileCheckInterval);
    }
    if (this.websocket) {
      this.websocket.close();
    }
    this.setState({ isFileUploaded: false, audioPreviewUrl: '', uploadUrl: '' });
    this.props.clearState();
  }

  render() {
    const {
      selectedFile,
      transcription,
      transcriptionFilename,
      downloadableText,
      errorUploading,
      errorTranscribing,
      isUploading,
      isProcessing,
      accuracyMode,
    } = this.props;

    const { isFileUploaded, audioPreviewUrl } = this.state;

    return (
      <div className="container">
        <h2>Transcribe Audio</h2>
        
        <label className="label-file">
          Choose Audio File
          <input
            type="file"
            onChange={this.handleFileChange}
            accept="audio/*"
            className="input-file"
            disabled={isUploading || isProcessing}
          />
        </label>

        {isUploading && <p>Uploading file...</p>}
        {errorUploading && <p className="error">{errorUploading}</p>}

        {/* Audio Preview Section */}
        {isFileUploaded && audioPreviewUrl && (
          <div className="audio-preview">
            <h3>Audio Preview:</h3>
            <audio controls style={{ width: '100%', marginBottom: '20px' }}>
              <source src={audioPreviewUrl} type={selectedFile.type} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {selectedFile && <p className="filename">{selectedFile.name}</p>}
        
        {/* Transcription Controls */}
        {isFileUploaded && (
          <div className="audio-container">
            <div className="combo-box">
              <h3>Select the accuracy mode</h3>
              <select value={accuracyMode} onChange={this.handleModeChange} disabled={isProcessing}>
                <option value="base">Base</option>
                <option value="tiny">Tiny</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            <button 
              onClick={this.handleTranscription} 
              disabled={isProcessing}
              style={{ marginTop: '10px' }}
            >
              {isProcessing ? 'Processing...' : 'Get Text from Audio'}
            </button>
          </div>
        )}
        
        {isProcessing && (
          <div>
            <p>Processing audio, please wait...</p>
            <button onClick={this.clearAllState}>Cancel</button>
          </div>
        )}
        
        {errorTranscribing && <p className="error">{errorTranscribing}</p>}
        
        {/* Transcription Results */}
        {transcription && (
          <div className="transcription">
            <h3>Transcription Ready:</h3>
            <a href={downloadableText} download={transcriptionFilename} className="button">
              Download Transcription
            </a>
            <textarea readOnly value={transcription} />
            <button onClick={this.clearAllState}>Transcribe New Audio</button>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedFile: state.appRootReducer.selectedFile,
  selectedFilename: state.appRootReducer.selectedFilename,
  uploadedFile: state.appRootReducer.uploadedFile,
  transcription: state.appRootReducer.transcription,
  transcriptionFilename: state.appRootReducer.transcriptionFilename,
  pidProcess: state.appRootReducer.pidProcess,
  downloadableText: state.appRootReducer.downloadableText,
  errorUploading: state.appRootReducer.errorUploading,
  errorTranscribing: state.appRootReducer.errorTranscribing,
  isUploading: state.appRootReducer.isUploading,
  isProcessing: state.appRootReducer.isProcessing,
  accuracyMode: state.appRootReducer.accuracyMode,
});

const mapDispatchToProps = {
  setSelectedFile,
  setSelectedFilename,
  setUploadedFile,
  setTranscription,
  setTranscriptionFilename,
  setPidProcess,
  setDownloadableText,
  setErrorUploading,
  setErrorTranscribing,
  setIsUploading,
  setIsProcessing,
  setAccuracyMode,
  clearState,
};

export default connect(mapStateToProps, mapDispatchToProps)(GetTextAudio);