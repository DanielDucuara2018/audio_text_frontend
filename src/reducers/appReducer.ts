import {
  SET_CURRENT_JOB,
  ADD_JOB_TO_HISTORY,
  UPDATE_JOB_STATUS,
  CLEAR_CURRENT_JOB,
  SET_SETTINGS,
  SET_ERROR,
  CLEAR_ERROR,
  REMOVE_JOB_FROM_HISTORY,
  VIEW_JOB_RESULT,
} from '../actions/appActions';
import { TranscriptionJob, AppSettings, WhisperModel } from '../types';
import { UnknownAction } from 'redux';

interface AppState {
  currentJob: TranscriptionJob | null;
  jobs: TranscriptionJob[];
  settings: AppSettings;
  error: string | null;
}

interface AppAction extends UnknownAction {
  type: string;
  payload?: any;
}

const initialState: AppState = {
  // Current active job
  currentJob: null,
  
  // Job history (persisted)
  jobs: [],
  
  // User settings (persisted)
  settings: {
    whisperModel: 'base' as WhisperModel,
  },
  
  // UI state (not persisted)
  error: null,
};

const appReducer = (state: AppState = initialState, action: AppAction): AppState => {
  switch (action.type) {
    case SET_CURRENT_JOB:
      return {
        ...state,
        currentJob: action.payload,
        error: null
      };

    case ADD_JOB_TO_HISTORY:
      // Add new job to beginning of history, keep only last 20 jobs
      const newJobs = [action.payload, ...state.jobs.filter(job => job.id !== action.payload.id)];
      return {
        ...state,
        jobs: newJobs.slice(0, 20)
      };

    case UPDATE_JOB_STATUS:
      const updatedJobData = action.payload;

      // Update current job if it matches - merge with existing data
      const newCurrentJob = state.currentJob?.id === updatedJobData.id 
        ? { ...state.currentJob, ...updatedJobData }
        : state.currentJob;

      // Update job in history - merge with existing data
      const updatedJobs = state.jobs.map(job =>
        job.id === updatedJobData.id 
          ? { ...job, ...updatedJobData }
          : job
      );

      return {
        ...state,
        currentJob: newCurrentJob,
        jobs: updatedJobs
      };

    case CLEAR_CURRENT_JOB:
      return {
        ...state,
        currentJob: null,
        error: null
      };

    case SET_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case REMOVE_JOB_FROM_HISTORY:
      return {
        ...state,
        jobs: state.jobs.filter(job => job.id !== action.payload)
      };

    case VIEW_JOB_RESULT:
      return {
        ...state,
        currentJob: action.payload,
        error: null
      };

    default:
      return state;
  }
};

export default appReducer;
