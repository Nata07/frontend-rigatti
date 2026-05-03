import { useEffect, useRef, useState } from "react";

import { extractApiErrorMessage } from "../../services/api";
import { uploadProductImage } from "../../services/uploadService";

const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

interface ImageUploadProps {
  currentImage?: string;
  disabled?: boolean;
  onChange: (imagePath?: string) => void;
}

export function ImageUpload({
  currentImage,
  disabled = false,
  onChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const preview = selectedPreview ?? currentImage ?? "";

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function setObjectPreview(file: File) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setSelectedPreview(objectUrl);
  }

  function clearObjectPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setSelectedPreview(null);
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function validateFile(file: File) {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return "Only JPEG, PNG, and WEBP images are allowed.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "Image must be 5 MB or smaller.";
    }

    return null;
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      clearObjectPreview();
      setErrorMessage(validationError);
      setProgress(0);
      resetInput();
      return;
    }

    setErrorMessage(null);
    setObjectPreview(file);
    setIsUploading(true);
    setProgress(0);

    try {
      const result = await uploadProductImage(file, setProgress);
      onChange(result.imagePath);
      setProgress(100);
    } catch (error) {
      clearObjectPreview();
      setErrorMessage(extractApiErrorMessage(error, "Image upload failed."));
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove() {
    clearObjectPreview();
    setErrorMessage(null);
    setProgress(0);
    onChange(undefined);
    resetInput();
  }

  return (
    <div className="image-upload">
      <label className="field">
        <span>Product image</span>
        <input
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || isUploading}
          name="image"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
      </label>

      <p className="image-upload__hint">JPEG, PNG, or WEBP up to 5 MB.</p>

      {preview ? (
        <div className="image-upload__preview">
          <img alt="Product preview" className="image-upload__preview-image" src={preview} />
          <button
            className="secondary-button"
            disabled={disabled || isUploading}
            onClick={handleRemove}
            type="button"
          >
            Remove image
          </button>
        </div>
      ) : null}

      {isUploading ? (
        <div aria-live="polite" className="image-upload__progress">
          <span>Uploading... {progress}%</span>
          <progress max={100} value={progress} />
        </div>
      ) : null}

      {errorMessage ? (
        <p aria-live="polite" className="field-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
