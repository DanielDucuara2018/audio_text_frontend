import { useRef, useCallback, useEffect } from 'react';
import Api, { getWebSocketUrl } from '../Api';
import { JobStatus, TranscriptionJob } from '../types';

interface WebSocketMessage {
  type: 'ping' | 'pong' | 'job_update' | 'error' | 'connected' | 'echo';
  job_id?: string;
  status?: JobStatus;
  progress?: number;
  result?: string;
  error?: string;
  message?: string;
  language?: string;
  language_probability?: number;
  processing_time?: number;
  connection_id?: string;
  timestamp?: string;
  data?: string;
}

interface UseWebSocketOptions {
  onJobUpdate: (jobUpdate: Partial<TranscriptionJob>) => void;
  onError?: (error: string) => void;
  currentJob?: TranscriptionJob | null;
}

export const useWebSocket = ({ onJobUpdate, onError, currentJob }: UseWebSocketOptions) => {
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Use refs to avoid stale closures in callbacks
  const onJobUpdateRef = useRef(onJobUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
    onErrorRef.current = onError;
  }, [onJobUpdate, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      console.log('Closing WebSocket connection...');
      try {
        websocketRef.current.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      websocketRef.current = null;
    }
  }, []);

  const connect = useCallback((jobId: string) => {
    // Store the job ID for reconnection
    currentJobIdRef.current = jobId;

    // Close existing connection if any
    disconnect();

    // Small delay to ensure previous connection is fully closed
    setTimeout(() => {
      const wsUrl = `${getWebSocketUrl('/job/ws/')}${jobId}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      try {
        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected for job:', jobId);
        };

        ws.onmessage = (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            
            // Handle ping messages with pong response
            if (data.type === 'ping') {
              try {
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
              } catch (error) {
                console.error('Failed to send pong:', error);
              }
              return;
            }
            
            // Handle job updates
            if (data.type === 'job_update') {
              const jobUpdate: Partial<TranscriptionJob> = {
                id: jobId,
                status: data.status,
              };

              // Add optional fields if present (convert from snake_case to camelCase)
              if (data.result !== undefined) jobUpdate.result = data.result;
              if (data.error !== undefined) jobUpdate.error = data.error;
              if (data.language !== undefined) jobUpdate.language = data.language;
              if (data.language_probability !== undefined) jobUpdate.languageProbability = data.language_probability;
              if (data.processing_time !== undefined) jobUpdate.processingTime = data.processing_time;
              if (data.progress !== undefined) jobUpdate.progress = data.progress;

              // Add timestamp if not present
              if (!jobUpdate.completedAt && (data.status === 'completed' || data.status === 'failed')) {
                jobUpdate.completedAt = new Date().toISOString();
              }

              onJobUpdateRef.current(jobUpdate);

              // Close WebSocket for terminal states
              if (data.status === 'completed' || data.status === 'failed') {
                console.log('Job reached terminal state, closing WebSocket');
                disconnect();
              }
            }

            // Handle error messages
            if (data.type === 'error') {
              console.error('WebSocket error:', data.error);
              if (onErrorRef.current && data.error) {
                onErrorRef.current(data.error);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (onErrorRef.current) {
            onErrorRef.current('WebSocket connection error');
          }
        };

        ws.onclose = async (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          websocketRef.current = null;

          // If WebSocket closed normally (code 1000) after job completion,
          // fetch the final complete data from API endpoint
          if (event.code === 1000 && currentJobIdRef.current) {
            try {
              console.log('Job completed, fetching final status from API...');
              const response = await Api.get(`/job/status/${currentJobIdRef.current}`);
              const jobData = response.data;

              const finalJobUpdate: Partial<TranscriptionJob> = {
                id: currentJobIdRef.current,
                status: jobData.status as JobStatus,
                result: jobData.result_text || currentJob?.result,
                error: jobData.error_message,
                processingTime: jobData.processing_time_seconds,
                language: jobData.language,
                languageProbability: jobData.language_probability,
                whisperModel: jobData.whisper_model,
                completedAt: jobData.update_date || new Date().toISOString(),
              };

              onJobUpdateRef.current(finalJobUpdate);
              console.log('Final job data fetched from API:', finalJobUpdate);
            } catch (error) {
              console.error('Failed to fetch final job status:', error);
              if (onErrorRef.current) {
                onErrorRef.current('Failed to fetch final transcription result');
              }
            }
            currentJobIdRef.current = null; // Clear job ID after completion
          }
          // Attempt to reconnect for non-terminal closures (unless manually closed)
          else if (event.code !== 1000 && currentJobIdRef.current) {
            console.log('Attempting to reconnect in 3 seconds...');
            reconnectTimeoutRef.current = setTimeout(() => {
              if (currentJobIdRef.current) {
                connect(currentJobIdRef.current);
              }
            }, 3000);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        if (onErrorRef.current) {
          onErrorRef.current('Failed to establish WebSocket connection');
        }
      }
    }, 100);
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected: websocketRef.current?.readyState === WebSocket.OPEN,
  };
};
