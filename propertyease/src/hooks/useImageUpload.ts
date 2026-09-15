// ==========================================
// useImageUpload — uploads an image to /api/upload.
// Uses XHR instead of fetch so we get real progress events.
// ==========================================

'use client';

import { useCallback, useRef, useState } from 'react';

export interface UploadResult {
  url: string;
}

export interface UseImageUpload {
  upload: (file: File) => Promise<UploadResult>;
  uploading: boolean;
  /** 0–100. -1 when idle. */
  progress: number;
  error: string | null;
  reset: () => void;
}

export function useImageUpload(endpoint = '/api/upload'): UseImageUpload {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(
    (file: File) =>
      new Promise<UploadResult>((resolve, reject) => {
        setError(null);
        setProgress(0);
        setUploading(true);

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          setUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as
                | { success: true; data: UploadResult }
                | { success: false; error: string };
              if (data.success) {
                setProgress(100);
                resolve(data.data);
                return;
              }
              setError(data.error || 'Upload failed');
              reject(new Error(data.error || 'Upload failed'));
            } catch {
              setError('Invalid server response');
              reject(new Error('Invalid server response'));
            }
          } else {
            let msg = `Upload failed (${xhr.status})`;
            try {
              const data = JSON.parse(xhr.responseText) as { error?: string };
              if (data?.error) msg = data.error;
            } catch {
              /* keep status code message */
            }
            setError(msg);
            reject(new Error(msg));
          }
        });

        xhr.addEventListener('error', () => {
          setUploading(false);
          setError('Network error');
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          setUploading(false);
          setError('Upload cancelled');
          reject(new Error('Upload cancelled'));
        });

        const form = new FormData();
        form.append('file', file);
        xhr.open('POST', endpoint);
        xhr.send(form);
      }),
    [endpoint],
  );

  const reset = useCallback(() => {
    setProgress(-1);
    setError(null);
  }, []);

  return { upload, uploading, progress, error, reset };
}
