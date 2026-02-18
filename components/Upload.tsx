import { useState, useCallback } from "react";
import { useOutletContext } from "react-router";
import { CheckCircle2, ImageIcon, UploadIcon } from "lucide-react";
import {
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  REDIRECT_DELAY_MS,
} from "../lib/constants";

interface UploadProps {
  onComplete?: (base64: string) => void;
}

export const Upload = ({ onComplete }: UploadProps) => {
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { isSignedIn } = useOutletContext<AuthContext>();

  const processFile = (file: File) => {
    if (!isSignedIn) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File exceeds the 50MB limit.");
      return;
    }
    setError(null);

    setFile(file);
    setProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              onComplete?.(base64);
            }, REDIRECT_DELAY_MS);
            return 100;
          }
          return prev + PROGRESS_STEP;
        });
      }, PROGRESS_INTERVAL_MS);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (isSignedIn) setIsDragging(true);
    },
    [isSignedIn],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!isSignedIn) return;

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type.startsWith("image/")) {
        processFile(droppedFile);
      }
    },
    [isSignedIn],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) return;
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  return (
    <div className={"upload"}>
      {!file ? (
        <div
          className={`dropzone ${isDragging ? "is-dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className={"drop-input"}
            accept={".jpg,.png,.jpeg,.webp"}
            disabled={!isSignedIn}
            onChange={handleChange}
          />
          <div className={"drop-content"}>
            <div className={"drop-icon"}>
              <UploadIcon size={20} />
            </div>
            <p>
              {isSignedIn
                ? "Drag and drop your file here or click to upload"
                : "Please sign in to upload files"}
            </p>
            <p className={"help"}>Maximum file size: 50MB</p>
            {error && <p className={"help"}>{error}</p>}
          </div>
        </div>
      ) : (
        <div className={"upload-status"}>
          <div className={"status-content"}>
            <div className={"status-icon"}>
              {progress === 100 ? (
                <CheckCircle2 className={"check"} />
              ) : (
                <ImageIcon className={"image"} />
              )}
            </div>
            <h3>{file.name}</h3>
            <div className={"progress"}>
              <div className={"bar"} style={{ width: `${progress}%` }} />
              <p className={"status-text"}>
                {progress < 100 ? "Analyzing floor Plan.." : "Redirecting..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
