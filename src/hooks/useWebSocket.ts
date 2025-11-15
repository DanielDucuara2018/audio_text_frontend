import { useRef, useCallback, useEffect } from 'react';
import { getWebSocketUrl } from '../Api';
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
}

export const useWebSocket = ({ onJobUpdate, onError }: UseWebSocketOptions) => {
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

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

              onJobUpdate(jobUpdate);

              // Close WebSocket for terminal states
              if (data.status === 'completed' || data.status === 'failed') {
                console.log('Job reached terminal state, closing WebSocket');
                disconnect();
              }
            }

            // Handle error messages
            if (data.type === 'error') {
              console.error('WebSocket error:', data.error);
              if (onError && data.error) {
                onError(data.error);
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (onError) {
            onError('WebSocket connection error');
          }
        };

        ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          websocketRef.current = null;

          // Attempt to reconnect for non-terminal closures (unless manually closed)
          if (event.code !== 1000 && currentJobIdRef.current) {
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
        if (onError) {
          onError('Failed to establish WebSocket connection');
        }
      }
    }, 100);
  }, [disconnect, onJobUpdate, onError]);

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
