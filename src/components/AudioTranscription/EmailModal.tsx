import React, { useState } from 'react';
import { AxiosError } from 'axios';
import Api from '../../Api';

interface EmailModalProps {
  jobId: string;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  jobId,
  onClose,
}) => {
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async () => {
    setLocalError('');
    
    if (!emailAddress) {
      setLocalError('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);

      await Api.post(`/job/${jobId}/email`, {
        email: emailAddress,
      });

      setIsSuccess(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      setLocalError(axiosError.response?.data?.detail || 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
              </svg>
            </div>
            <h3 id="email-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Send by Email
            </h3>
          </div>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 
                       transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={onClose}
            aria-label="Close email modal"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSuccess ? (
            // Success State
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Email Sent Successfully!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                The transcription has been sent to <span className="font-semibold text-gray-900 dark:text-gray-100">{emailAddress}</span>
              </p>
              <button 
                onClick={onClose} 
                className="w-full px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 
                           hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-xl 
                           shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Close
              </button>
            </div>
          ) : (
            // Form State
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter your email address to receive the transcription directly in your inbox
              </p>
              
              {/* Error Message */}
              {localError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 text-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                    </svg>
                    <span>{localError}</span>
                  </div>
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,15C12.81,15 13.5,14.7 14.11,14.11C14.7,13.5 15,12.81 15,12C15,11.19 14.7,10.5 14.11,9.89C13.5,9.3 12.81,9 12,9C11.19,9 10.5,9.3 9.89,9.89C9.3,10.5 9,11.19 9,12C9,12.81 9.3,13.5 9.89,14.11C10.5,14.7 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C21,6.9 22,9.25 22,12V13.45C22,14.45 21.65,15.3 21,16C20.3,16.67 19.5,17 18.5,17C17.3,17 16.31,16.5 15.56,15.5C14.56,16.5 13.38,17 12,17C10.63,17 9.45,16.5 8.46,15.54C7.5,14.55 7,13.38 7,12C7,10.63 7.5,9.45 8.46,8.46C9.45,7.5 10.63,7 12,7C13.38,7 14.55,7.5 15.54,8.46C16.5,9.45 17,10.63 17,12V13.45C17,13.86 17.16,14.22 17.46,14.53C17.76,14.84 18.11,15 18.5,15C18.92,15 19.27,14.84 19.57,14.53C19.87,14.22 20,13.86 20,13.45V12C20,9.81 19.23,7.93 17.65,6.35C16.07,4.77 14.19,4 12,4C9.81,4 7.93,4.77 6.35,6.35C4.77,7.93 4,9.81 4,12C4,14.19 4.77,16.07 6.35,17.65C7.93,19.23 9.81,20 12,20H17V22H12C9.25,22 6.9,21 4.95,19.05C3,17.1 2,14.75 2,12C2,9.25 3,6.9 4.95,4.95C6.9,3 9.25,2 12,2Z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 
                             bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100
                             focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900
                             transition-all duration-200 outline-none"
                  aria-label="Email address"
                  disabled={isSending}
                  autoFocus
                  required
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="flex gap-3 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 
                       font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-700 
                       hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600
                       transition-all duration-200 disabled:opacity-50"
            disabled={isSending}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 
                       hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-xl 
                       shadow-lg hover:shadow-xl transition-all duration-200 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send Email'
            )}
          </button>
        </div>
        )}
      </div>
    </div>
  );
};
