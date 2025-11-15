import { TranscriptionJob, AppSettings } from '../types';

// Action Types
export const SET_CURRENT_JOB = 'SET_CURRENT_JOB';
export const ADD_JOB_TO_HISTORY = 'ADD_JOB_TO_HISTORY';
export const UPDATE_JOB_STATUS = 'UPDATE_JOB_STATUS';
export const CLEAR_CURRENT_JOB = 'CLEAR_CURRENT_JOB';
export const SET_SETTINGS = 'SET_SETTINGS';
export const SET_ERROR = 'SET_ERROR';
export const CLEAR_ERROR = 'CLEAR_ERROR';
export const REMOVE_JOB_FROM_HISTORY = 'REMOVE_JOB_FROM_HISTORY';
export const VIEW_JOB_RESULT = 'VIEW_JOB_RESULT';

// Action Creators
export const setCurrentJob = (job: TranscriptionJob | null) => ({
  type: SET_CURRENT_JOB,
  payload: job
});

export const addJobToHistory = (job: TranscriptionJob) => ({
  type: ADD_JOB_TO_HISTORY,
  payload: job
});

export const updateJobStatus = (job: Partial<TranscriptionJob>) => ({
  type: UPDATE_JOB_STATUS,
  payload: job
});

export const clearCurrentJob = () => ({
  type: CLEAR_CURRENT_JOB
});

export const setSettings = (settings: Partial<AppSettings>) => ({
  type: SET_SETTINGS,
  payload: settings
});

export const setError = (error: string | null) => ({
  type: SET_ERROR,
  payload: error
});

export const clearError = () => ({
  type: CLEAR_ERROR
});

export const removeJobFromHistory = (jobId: string) => ({
  type: REMOVE_JOB_FROM_HISTORY,
  payload: jobId
});

export const viewJobResult = (job: TranscriptionJob) => ({
  type: VIEW_JOB_RESULT,
  payload: job
});