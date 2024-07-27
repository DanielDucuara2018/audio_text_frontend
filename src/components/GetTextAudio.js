import React, { Component, createRef } from 'react';
import Api from "../Api";
import './GetTextAudio.css';

class GetTextAudio extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      uploadedFile: null,
      transcription: null,
      transcription_filename: null,
      error: null,
      isUploading: false,
      isProcessing: false,
      accuracyMode: 'medium',
    };
    this.audioRef = createRef();
    this.fileCheckInterval = null;

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleTranscription = this.handleTranscription.bind(this);
  }

  handleFileChange(event) {
    this.setState({ selectedFile: event.target.files[0] });
  }

  handleModeChange(event) {
    this.setState({ accuracyMode: event.target.value });
  }
  
  handleUpload() {
    const { selectedFile } = this.state;
    console.log(selectedFile)
    if (!selectedFile) {
      this.setState({ error: 'Please select an audio file to upload.' });
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    console.log(formData)
    this.setState({ isUploading: true });
    Api.post('audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      console.log(response.data.filename)
      this.setState({ uploadedFile: response.data.filename, error: null, isUploading: false }, () => {
        // if (this.audioRef.current) {
        //   this.audioRef.current.load();
        //   this.audioRef.current.play();
        // }
      });
    })
    .catch(error => {
      this.setState({ error: 'Error uploading file. Please try again.', isUploading: false });
    });
  }

  handleTranscription() {
    const { uploadedFile, accuracyMode } = this.state;
    if (!uploadedFile) {
      this.setState({ error: 'No audio file uploaded.' });
      return;
    }

    console.log(uploadedFile)
    this.setState({ isProcessing: true });
    Api.post('audio/transcribe', { filename: uploadedFile, mode: accuracyMode })
    .then(response => {
      const { transcription_filename } = response.data;
      this.setState({ transcription_filename })
      this.checkForTranscriptionFile(transcription_filename);
      
    })
    .catch(error => {
      this.setState({ error: 'Error getting transcription. Please try again.', isProcessing: false });
    });
  }

  checkForTranscriptionFile = (transcription_filename) => {
    const checkFile = () => {
      Api.get(`audio/transcription?filename=${transcription_filename}`)
        .then((response) => {
          const { transcription } = response.data;
          if (transcription) {
            this.setState({ transcription, isProcessing: false});
            clearInterval(this.fileCheckInterval);
          }
        })
        .catch((error) => {
          this.setState({ error: 'Error checking transcription file. Please try again.', isProcessing: false });
          clearInterval(this.fileCheckInterval);
        });
    };

    this.fileCheckInterval = setInterval(checkFile, 5000); // Poll every 5 seconds
    checkFile(); // Initial call
  };

  render() {
    const { selectedFile, uploadedFile, transcription_filename, transcription, error, isUploading, isProcessing, accuracyMode } = this.state;

    return (
      <div className="container">
        <h2>Transcribe Audio</h2>
        <label className="label-file">
          Choose Audio File
          <input type="file" onChange={this.handleFileChange} accept="audio/*" className="input-file" />
        </label>
        {selectedFile && (
          <p className="filename">{selectedFile.name}</p>
        )}
        <button onClick={this.handleUpload} disabled={isUploading || isProcessing}>Upload Audio</button>
        {error && <p className="error">{error}</p>}
        {uploadedFile && (
          <div>
            <p>Uploaded Audio: {selectedFile.name}</p>
            <div className="audio-container">
              <audio controls >
                <source src={require(`../../tmp/uploads/${uploadedFile}`)} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
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
              <button onClick={this.handleTranscription} disabled={isUploading || isProcessing}>Get Text from Audio</button>
            </div>
          </div>
        )}
        {isProcessing && <p>Processing audio, please wait...</p>}
        {error && <p className="error">{error}</p>}
        {transcription && (
          <div className="transcription">
            <h3>Transcription Ready:</h3>
            <a href={require(`../../tmp/transcriptions/${transcription_filename}`)} download className="button">
              Download Transcription
            </a>
            <textarea readOnly value={transcription} />
          </div>
        )}
      </div>
    );
  }
}

export default GetTextAudio;