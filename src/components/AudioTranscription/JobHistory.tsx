import React from 'react';
import { TranscriptionJob, JobStatus } from '../../types';

interface JobHistoryProps {
  jobHistory: TranscriptionJob[];
  isProcessing: boolean;
  onViewJob: (job: TranscriptionJob) => void;
  onRemoveJob: (jobId: string) => void;
}

const JOB_STATUS: Record<string, JobStatus> = {
  PENDING: 'pending' as JobStatus,
  PROCESSING: 'processing' as JobStatus,
  COMPLETED: 'completed' as JobStatus,
  FAILED: 'failed' as JobStatus
};

export const JobHistory: React.FC<JobHistoryProps> = ({
  jobHistory,
  isProcessing,
  onViewJob,
  onRemoveJob
}) => {
  if (jobHistory.length === 0 || isProcessing) {
    return null;
  }

  return (
    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3" />
        </svg>
        Recent Jobs
      </h3>
      <div className="grid gap-3 sm:gap-4">
        {jobHistory.slice(0, 10).map((job: TranscriptionJob) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 
                       rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 hover:border-primary-300 dark:hover:border-primary-600"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
                    {job.filename}
                  </span>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0
                      ${job.status === JOB_STATUS.COMPLETED ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                      ${job.status === JOB_STATUS.PROCESSING ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                      ${job.status === JOB_STATUS.FAILED ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                      ${job.status === JOB_STATUS.PENDING ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H17M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M9,14V16H7V14H9M13,14V16H11V14H13M17,14V16H15V14H17Z" />
                    </svg>
                    {new Date(job.completedAt || job.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {job.status === JOB_STATUS.COMPLETED && job.result && (
                  <button
                    onClick={() => onViewJob(job)}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 
                               hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200"
                    title="View result"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => onRemoveJob(job.id)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 
                             hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-200"
                  title="Remove from history"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
