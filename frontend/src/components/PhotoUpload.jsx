import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Image as ImageIcon, X, UploadCloud } from 'lucide-react';

export default function PhotoUpload({ file, preview, onChange, onRemove, error, setError }) {
  const { settings } = useSettings();
  const maxMb = Number(settings.max_upload_size_mb) || 5;
  const maxBytes = maxMb * 1024 * 1024;

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
    if (selectedFile.size > maxBytes) {
      if (setError) setError(`Photo size exceeds the maximum limit of ${maxMb}MB.`);
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
    <div className="space-y-2">
      <input
        type="file"
        ref={inputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-terracotta-400 bg-terracotta-50/50'
              : 'border-line hover:border-terracotta-400/50 bg-paper hover:bg-paper-hover'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-full bg-paper-card border border-line flex items-center justify-center text-ink-muted">
            <UploadCloud className="w-5 h-5 text-terracotta-400" />
          </div>
          <div className="text-xs text-ink">
            <span className="font-semibold text-terracotta-400 hover:underline">Click to upload photo</span> or drag & drop file here
          </div>
          <div className="text-[11px] text-ink-muted">PNG, JPG, WEBP or GIF up to {maxMb}MB (Optional)</div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-line bg-paper-card shadow-soft">
          <img src={preview} alt="Attachment preview" className="w-12 h-12 rounded-lg object-cover border border-line" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-ink truncate">{file ? file.name : 'Attached Photo'}</div>
            {file && <div className="text-[11px] text-ink-muted">{formatSize(file.size)}</div>}
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-clay-500 hover:text-clay-600 hover:bg-clay-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
              }
              onRemove();
            }}
            title="Remove photo"
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      )}

      {error && <div className="text-xs text-clay-500 font-medium">{error}</div>}
    </div>
  );
}
