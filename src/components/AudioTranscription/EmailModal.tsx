import React, { useState } from 'react';
import { AxiosError } from 'axios';
import Api from '../../Api';

interface EmailModalProps {
  jobId: string;
  onClose: () => void;
  onError: (error: string) => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  jobId,
  onClose,
  onError,
}) => {
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!emailAddress) {
      onError('Please enter a valid email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      onError('Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);

      await Api.post('/audio/send_transcription_email', {
        id: jobId,
        email: emailAddress,
      });

      alert('Transcription sent successfully to ' + emailAddress);
      setEmailAddress('');
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      onError(axiosError.response?.data?.detail || 'Failed to send email. Please try again.');
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
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="email-modal-title">Send Transcription by Email</h3>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Close email modal"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-description">
            Enter your email address to receive the transcription
          </p>
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="your@email.com"
            className="email-input"
            aria-label="Email address"
            disabled={isSending}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="modal-btn cancel"
            disabled={isSending}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="modal-btn submit"
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};
