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
      transcriptionFilename: null,
      downloadaleText: null,
      error: null,
      isUploading: false,
      isProcessing: false,
      accuracyMode: 'medium',
    };
    // this.audioRef = createRef();
    this.fileCheckInterval = null;

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleTranscription = this.handleTranscription.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
  }

  handleFileChange(event) {
    this.setState({ selectedFile: event.target.files[0] });
  }

  handleModeChange(event) {
    this.setState({ accuracyMode: event.target.value });
  }
  
  handleUpload() {
    const { selectedFile } = this.state;
    if (!selectedFile) {
      this.setState({ error: 'Please select an audio file to upload.' });
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    this.setState({ isUploading: true });
    Api.post('audio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      const uploadedFile = response.data.filename;
      console.log(uploadedFile);
      this.setState({ uploadedFile, error: null, isUploading: false }, () => {
        this.getAudioData(uploadedFile);
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
      const transcriptionFilename = response.data.transcription_filename;
      this.setState({ transcriptionFilename });
      this.getTranscriptionData(transcriptionFilename);
      
    })
    .catch(error => {
      this.setState({ error: 'Error getting transcription. Please try again.', isProcessing: false });
    });
  }

  getTranscriptionData = (transcriptionFilename) => {
    const checkTranscriptionFile = () => {
      Api.get(`audio/transcription?filename=${transcriptionFilename}`)
      .then((response) => {
        const { transcription } = response.data;
        if (transcription) {
          this.setState({ transcription, isProcessing: false, downloadaleText: new Blob([transcription], {type: 'text/plain'})});
          clearInterval(this.fileCheckInterval);
        }
      })
      .catch((error) => {
        this.setState({ error: 'Error checking transcription file. Please try again.', isProcessing: false });
        clearInterval(this.fileCheckInterval);
      });
    };

    this.fileCheckInterval = setInterval(checkTranscriptionFile, 5000);
    checkTranscriptionFile();
  };

  getAudioData = (audioFilename) => {
    Api.get(`audio/data?filename=${audioFilename}`)
    .then((response) => {
      // console.log(response.data)
      // const audioData = URL.createObjectURL(new Blob([response.data], { type: 'audio/mpeg' }));
      // console.log(this.audioRef)
      // if (this.audioRef.current) {
      //   this.audioRef.current.src = audioData;
      //   this.audioRef.current.load();
      //   this.audioRef.current.play();
      // }
    })
    .catch((error) => {
      this.setState({ error: 'Error checking transcription file. Please try again.', isProcessing: false });
    });
  };

  render() {
    const { selectedFile, uploadedFile, transcriptionFilename, transcription, downloadaleText, error, isUploading, isProcessing, accuracyMode } = this.state;

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
              {/* <audio controls ref={this.audioRef} >
                <source type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio> */}
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
            <a href={URL.createObjectURL(downloadaleText)} download={transcriptionFilename} className="button">
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