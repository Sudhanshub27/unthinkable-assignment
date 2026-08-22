import { useState, useRef, useEffect } from 'react';

export default function PhotoUpload({ file, preview, onChange, onRemove, error, setError }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      if (setError) setError('Please upload a valid image file (JPEG, PNG, WEBP, GIF).');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      if (setError) setError('Photo size must be under 5MB.');
      return;
    }
    if (setError) setError('');
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    onChange(selectedFile, objectUrl);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="photo-upload-container">
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!preview ? (
        <div
          className={`photo-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="dropzone-icon">📷</div>
          <div className="dropzone-text">
            <span className="dropzone-link">Click to upload photo</span> or drag & drop file here
          </div>
          <div className="dropzone-hint">PNG, JPG, WEBP or GIF up to 5MB (Optional)</div>
        </div>
      ) : (
        <div className="photo-preview-card">
          <img src={preview} alt="Attachment preview" className="photo-preview-img" />
          <div className="photo-preview-info">
            <div className="photo-preview-name">{file ? file.name : 'Attached Photo'}</div>
            {file && <div className="photo-preview-size">{formatSize(file.size)}</div>}
          </div>
          <button
            type="button"
            className="photo-preview-remove"
            onClick={(e) => {
              e.stopPropagation();
              if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
              }
              onRemove();
            }}
            title="Remove photo"
          >
            Remove
          </button>
        </div>
      )}

      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
