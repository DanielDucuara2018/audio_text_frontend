import {
    SET_SELECTED_FILE,
    SET_SELECTED_FILENAME,
    SET_UPLOADED_FILE,
    SET_TRANSCRIPTION,
    SET_TRANSCRIPTION_FILENAME,
    SET_PID_PROCESS,
    SET_DOWNLOADABLE_TEXT,
    SET_ERROR_UPLOADING,
    SET_ERROR_TRANSCRIBING,
    SET_IS_UPLOADING,
    SET_IS_PROCESSING,
    SET_ACCURACY_MODE,
    CLEAR_STATE,
  } from '../actions/appActions';
  
  const initialState = {
    selectedFile: null,
    selectedFilename: null,
    uploadedFile: null,
    transcription: null,
    transcriptionFilename: null,
    pidProcess: null,
    downloadableText: null,
    errorUploading: null,
    errorTranscribing: null,
    isUploading: false,
    isProcessing: false,
    accuracyMode: 'medium',
  };
  
  const appReducer = (state = initialState, action) => {
    switch (action.type) {
      case SET_SELECTED_FILE:
        return { ...state, selectedFile: action.payload };
      case SET_SELECTED_FILENAME:
        return { ...state, selectedFilename: action.payload };
      case SET_UPLOADED_FILE:
        return { ...state, uploadedFile: action.payload };
      case SET_TRANSCRIPTION:
        return { ...state, transcription: action.payload };
      case SET_TRANSCRIPTION_FILENAME:
        return { ...state, transcriptionFilename: action.payload };
      case SET_PID_PROCESS:
        return { ...state, pidProcess: action.payload };
      case SET_DOWNLOADABLE_TEXT:
        return { ...state, downloadableText: action.payload };
      case SET_ERROR_UPLOADING:
        return { ...state, errorUploading: action.payload };
      case SET_ERROR_TRANSCRIBING:
        return { ...state, errorTranscribing: action.payload };
      case SET_IS_UPLOADING:
        return { ...state, isUploading: action.payload };
      case SET_IS_PROCESSING:
        return { ...state, isProcessing: action.payload };
      case SET_ACCURACY_MODE:
        return { ...state, accuracyMode: action.payload };
      case CLEAR_STATE:
        return initialState;
      default:
        return state;
    }
  };
  
  export default appReducer;