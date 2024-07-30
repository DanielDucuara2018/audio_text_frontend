import React, { Component } from "react"; // createRef
import Api from "../Api";
import "./GetTextAudio.css";

class GetTextAudio extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      uploadedFile: null,
      transcription: null,
      transcriptionFilename: null,
      pidProccess: null,
      downloadaleText: null,
      errorUploading: null,
      errorTranscribing: null,
      isUploading: false,
      isProcessing: false,
      accuracyMode: "medium",
    };
    // this.audioRef = createRef();
    this.fileCheckInterval = null;

    this.handleFileChange = this.handleFileChange.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleTranscription = this.handleTranscription.bind(this);
    this.handleModeChange = this.handleModeChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  componentDidMount() {
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  }

  handleBeforeUnload(event) {
    console.log("Terminating old transcription");
    const pid = localStorage.getItem("pid");
    if (pid) {
      this.terminateTranscription(pid);
    }
  }

  handleFileChange(event) {
    this.setState({
      selectedFile: event.target.files[0],
      errorUploading: null,
      errorTranscribing: null,
    });
  }

  handleModeChange(event) {
    this.setState({ accuracyMode: event.target.value });
  }

  handleUpload() {
    const { selectedFile } = this.state;
    if (!selectedFile) {
      this.setState({
        errorUploading: "Please select an audio file to upload.",
      });
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);

    this.setState({ isUploading: true });
    Api.post("audio/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => {
        const uploadedFile = response.data.filename;
        this.setState(
          { uploadedFile, errorUploading: null, isUploading: false },
          () => {
            // this.getAudioData(uploadedFile);
          }
        );
      })
      .catch((error) => {
        this.setState({
          errorUploading: "Error uploading file. Please try again.",
          isUploading: false,
        });
      });
  }

  handleTranscription() {
    const { uploadedFile, accuracyMode } = this.state;
    if (!uploadedFile) {
      this.setState({ errorTranscribing: "No audio file uploaded." });
      return;
    }

    console.log(uploadedFile);
    this.setState({ isProcessing: true });
    Api.post("audio/transcribe", { filename: uploadedFile, mode: accuracyMode })
      .then((response) => {
        const transcriptionFilename = response.data.transcription_filename;
        const pid = response.data.pid_process;
        this.setState({
          transcriptionFilename,
          errorTranscribing: null,
          pidProccess: pid,
        });
        this.getTranscriptionData(transcriptionFilename);
        localStorage.setItem("pid", pid);
        console.log(pid);
      })
      .catch((error) => {
        this.setState({
          errorTranscribing: "Error getting transcription. Please try again.",
          isProcessing: false,
        });
        const pid = this.pidProccess;
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
            this.setState({
              transcription,
              errorTranscribing: null,
              isProcessing: false,
              downloadaleText: new Blob([transcription], {
                type: "text/plain",
              }),
            });
            localStorage.clear();
            clearInterval(this.fileCheckInterval);
          }
        })
        .catch((error) => {
          this.setState({
            errorTranscribing:
              "Error checking transcription file. Please try again.",
            isProcessing: false,
          });
          const pid = this.pidProccess;
          if (pid) {
            this.terminateTranscription(pid);
          }
          localStorage.clear();
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
        this.setState({
          errorUploading: "Error getting audio data to play it.",
          isProcessing: false,
        });
      });
  };

  terminateTranscription = (pid) => {
    console.log(pid);
    Api.post("audio/terminate", { pid: pid })
      .then((response) => {
        console.log("Transcription killed succesfully");
      })
      .catch((error) => {
        this.setState({
          errorTranscribing: "Error Killing transcription process",
        });
      });
  };

  render() {
    const {
      selectedFile,
      uploadedFile,
      transcriptionFilename,
      transcription,
      downloadaleText,
      errorUploading,
      errorTranscribing,
      isUploading,
      isProcessing,
      accuracyMode,
    } = this.state;

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
        {selectedFile && <p className="filename">{selectedFile.name}</p>}
        <button
          onClick={this.handleUpload}
          disabled={isUploading || isProcessing}
        >
          Upload Audio
        </button>
        {errorUploading && <p className="error">{errorUploading}</p>}
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
              <button
                onClick={this.handleTranscription}
                disabled={isUploading || isProcessing}
              >
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
            <a
              href={URL.createObjectURL(downloadaleText)}
              download={transcriptionFilename}
              className="button"
            >
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
