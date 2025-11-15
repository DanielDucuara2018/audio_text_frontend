import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Api from '../Api';

interface UseFileUploadOptions {
  onError?: (error: string) => void;
  maxSizeMB?: number;
}

interface PresignedUrlResponse {
  url: string;
}

const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
  'video/mp4',
  'audio/opus',
];

const ALLOWED_EXTENSIONS = /\.(mp3|wav|m4a|flac|ogg|aac|mp4|opus)$/i;

export const useFileUpload = ({ onError, maxSizeMB = 10 }: UseFileUploadOptions = {}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const validateFile = useCallback((file: File): string | null => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(ALLOWED_EXTENSIONS)) {
      return 'Please select a valid audio file (MP3, WAV, M4A, FLAC, OGG, AAC, MP4, OPUS)';
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  }, [maxSizeMB]);

  const selectFile = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      if (onError) onError(validationError);
      return false;
    }

    setSelectedFile(file);
    
    // Create preview URL and clean up previous one
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setAudioPreviewUrl(previewUrl);

    try {
      // Get presigned URL for upload
      const response = await Api.get<PresignedUrlResponse>('/audio/get_presigned_url', {
        params: {
          filename: file.name,
          content_type: file.type,
          file_size: file.size
        }
      });
      
      setPresignedUrl(response.data.url);
      return true;
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to prepare file upload';
      if (onError) onError(errorMessage);
      return false;
    }
  }, [validateFile, audioPreviewUrl, onError]);

  const uploadFile = useCallback(async (): Promise<string | null> => {
    if (!selectedFile || !presignedUrl) {
      if (onError) onError('No file selected or presigned URL not available');
      return null;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Upload directly to S3 using presigned URL
      await axios.put(presignedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type,
        },
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded)
          );
          setUploadProgress(progress);
        }
      });

      setIsUploading(false);
      return presignedUrl;
    } catch (error) {
      setIsUploading(false);
      const axiosError = error as AxiosError<{ detail?: string }>;
      const errorMessage = axiosError.response?.data?.detail || 'Failed to upload file';
      if (onError) onError(errorMessage);
      return null;
    }
  }, [selectedFile, presignedUrl, onError]);

  const resetFile = useCallback(() => {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setSelectedFile(null);
    setPresignedUrl(null);
    setAudioPreviewUrl('');
    setUploadProgress(0);
    setIsUploading(false);
  }, [audioPreviewUrl]);

  return {
    selectedFile,
    uploadProgress,
    presignedUrl,
    audioPreviewUrl,
    isUploading,
    selectFile,
    uploadFile,
    resetFile,
  };
};
