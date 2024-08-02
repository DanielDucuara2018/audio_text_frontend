


export const SET_SELECTED_FILE = 'SET_SELECTED_FILE';
export const SET_SELECTED_FILENAME = 'SET_SELECTED_FILENAME';
export const SET_UPLOADED_FILE = 'SET_UPLOADED_FILE';
export const SET_TRANSCRIPTION = 'SET_TRANSCRIPTION';
export const SET_TRANSCRIPTION_FILENAME = 'SET_TRANSCRIPTION_FILENAME';
export const SET_PID_PROCESS = 'SET_PID_PROCESS';
export const SET_DOWNLOADABLE_TEXT = 'SET_DOWNLOADABLE_TEXT';
export const SET_ERROR_UPLOADING = 'SET_ERROR_UPLOADING';
export const SET_ERROR_TRANSCRIBING = 'SET_ERROR_TRANSCRIBING';
export const SET_IS_UPLOADING = 'SET_IS_UPLOADING';
export const SET_IS_PROCESSING = 'SET_IS_PROCESSING';
export const SET_ACCURACY_MODE = 'SET_ACCURACY_MODE';
export const CLEAR_STATE = 'CLEAR_STATE';

export const setSelectedFile = (file) => ({ type: SET_SELECTED_FILE, payload: file });
export const setSelectedFilename = (filename) => ({ type: SET_SELECTED_FILENAME, payload: filename });
export const setUploadedFile = (file) => ({ type: SET_UPLOADED_FILE, payload: file });
export const setTranscription = (transcription) => ({ type: SET_TRANSCRIPTION, payload: transcription });
export const setTranscriptionFilename = (filename) => ({ type: SET_TRANSCRIPTION_FILENAME, payload: filename });
export const setPidProcess = (pid) => ({ type: SET_PID_PROCESS, payload: pid });
export const setDownloadableText = (text) => ({ type: SET_DOWNLOADABLE_TEXT, payload: text });
export const setErrorUploading = (error) => ({ type: SET_ERROR_UPLOADING, payload: error });
export const setErrorTranscribing = (error) => ({ type: SET_ERROR_TRANSCRIBING, payload: error });
export const setIsUploading = (isUploading) => ({ type: SET_IS_UPLOADING, payload: isUploading });
export const setIsProcessing = (isProcessing) => ({ type: SET_IS_PROCESSING, payload: isProcessing });
export const setAccuracyMode = (mode) => ({ type: SET_ACCURACY_MODE, payload: mode });
export const clearState = () => ({ type: CLEAR_STATE });
  