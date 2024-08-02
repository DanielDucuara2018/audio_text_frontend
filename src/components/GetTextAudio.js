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
} from '../actions/getTextAudioActions';
import Api from '../Api';
import './GetTextAudio.css';

class GetTextAudio extends Component {
  constructor(props) {
    super(props);
    this.fileCheckInterval = null;

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleTranscription = this.handleTranscription.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleAfterload = this.handleAfterload.bind(this);
    this.clearAllState = this.clearAllState.bind(this);
  }

  componentDidMount() {
    window.addEventListener('load', this.handleAfterload);
  }

  componentWillUnmount() {
    window.URL.revokeObjectURL(this.props.downloadableText);
  }

  handleAfterload(event) {
    const transcriptionFilename = this.props.transcriptionFilename;
    if (transcriptionFilename) {
      this.getTranscriptionData(transcriptionFilename);
    }
  }

  handleFileChange(event) {
    this.props.setSelectedFile(event.target.files[0]);
    this.props.setErrorUploading(null);
    this.props.setErrorTranscribing(null);
  }

  handleModeChange(event) {
    this.props.setAccuracyMode(event.target.value);
  }

  handleUpload() {
    const { selectedFile } = this.props;
    if (!selectedFile) {
      this.props.setErrorUploading('Please select an audio file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    this.props.setSelectedFilename(selectedFile.name)

    this.props.setIsUploading(true);
    Api.post('audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => {
        this.props.setUploadedFile(response.data.filename);
        this.props.setErrorUploading(null);
        this.props.setIsUploading(false);
      })
      .catch((error) => {
        this.props.setErrorUploading('Error uploading file. Please try again.');
        this.props.setIsUploading(false);
      });
  }

  handleTranscription() {
    const { uploadedFile, accuracyMode } = this.props;
    if (!uploadedFile) {
      this.props.setErrorTranscribing('No audio file uploaded.');
      return;
    }

    this.props.setIsProcessing(true);
    Api.post('audio/transcribe', { filename: uploadedFile, mode: accuracyMode })
      .then((response) => {
        this.props.setTranscriptionFilename(response.data.transcription_filename);
        this.props.setPidProcess(response.data.pid_process);
        this.getTranscriptionData(response.data.transcription_filename);
        localStorage.setItem('pid', response.data.pid_process);
      })
      .catch((error) => {
        this.props.setErrorTranscribing('Error getting transcription. Please try again.');
        this.props.setIsProcessing(false);
        const pid = this.props.pidProcess;
        if (pid) {
          this.terminateTranscription(pid);
        }
      });
  }

  getTranscriptionData = (transcriptionFilename) => {
    const checkTranscriptionFile = () => {
      Api.get(`audio/transcription?filename=${transcriptionFilename}`)
        .then((response) => {
          const { transcription } = response.data;
          if (transcription) {
            this.props.setTranscription(transcription);
            this.props.setIsProcessing(false);
            this.props.setDownloadableText(URL.createObjectURL(new Blob([transcription], { type: 'text/plain' })));

            clearInterval(this.fileCheckInterval);
          }
        })
        .catch((error) => {
          this.props.setErrorTranscribing('Error checking transcription file. Please try again.');
          this.props.setIsProcessing(false);
          const pid = this.props.pidProcess;
          if (pid) {
            this.terminateTranscription(pid);
          }
          clearInterval(this.fileCheckInterval);
        });
    };

    this.fileCheckInterval = setInterval(checkTranscriptionFile, 5000);
    checkTranscriptionFile();
  };

  terminateTranscription = (pid) => {
    Api.post('audio/terminate', { pid: pid })
      .then((response) => {
        console.log('Transcription killed successfully');
        localStorage.clear();
      })
      .catch((error) => {
        this.props.setErrorTranscribing('Error killing transcription process');
      });
  };

  clearAllState() {
    this.props.clearState();
  }

  render() {
    const {
      selectedFile,
      selectedFilename,
      uploadedFile,
      transcription,
      transcriptionFilename,
      downloadableText,
      errorUploading,
      errorTranscribing,
      isUploading,
      isProcessing,
      accuracyMode,
    } = this.props;
    console.log(downloadableText)
    console.log(transcription)

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
          />
        </label>
        {(selectedFilename || selectedFile) && <p className="filename">{selectedFilename || selectedFile.name}</p>}
        <button onClick={this.handleUpload} disabled={isUploading || isProcessing}>
          Upload Audio
        </button>
        {errorUploading && <p className="error">{errorUploading}</p>}
        {uploadedFile && (
          <div>
            <p>Uploaded Audio: {selectedFilename || selectedFile.name}</p>
            <div className="audio-container">
              <div className="combo-box">
                <h3>Select the accuracy mode</h3>
                <select value={accuracyMode} onChange={this.handleModeChange}>
                  <option value="base">Base</option>
                  <option value="tiny">Tiny</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <button onClick={this.handleTranscription} disabled={isUploading || isProcessing}>
                Get Text from Audio
              </button>
            </div>
          </div>
        )}
        {isProcessing && <p>Processing audio, please wait...</p>}
        {errorTranscribing && <p className="error">{errorTranscribing}</p>}
        {transcription && (
          <div className="transcription">
            <h3>Transcription Ready:</h3>
            <a href={downloadableText} download={transcriptionFilename} className="button">
              Download Transcription
            </a>
            <textarea readOnly value={transcription} />
            <button onClick={this.clearAllState}>transcribe new audio</button>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedFile: state.getTextAudio.selectedFile,
  selectedFilename: state.getTextAudio.selectedFilename,
  uploadedFile: state.getTextAudio.uploadedFile,
  transcription: state.getTextAudio.transcription,
  transcriptionFilename: state.getTextAudio.transcriptionFilename,
  pidProcess: state.getTextAudio.pidProcess,
  downloadableText: state.getTextAudio.downloadableText,
  errorUploading: state.getTextAudio.errorUploading,
  errorTranscribing: state.getTextAudio.errorTranscribing,
  isUploading: state.getTextAudio.isUploading,
  isProcessing: state.getTextAudio.isProcessing,
  accuracyMode: state.getTextAudio.accuracyMode,
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