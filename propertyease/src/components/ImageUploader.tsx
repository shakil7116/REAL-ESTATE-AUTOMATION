'use client';
// ==========================================
// ImageUploader — drag/drop or click-to-upload image input.
// Used by PropertyModal (single cover image) and UnitModal
// (gallery of up to 5 images). Replaces the old "paste URL"
// textarea with a real file upload. Also supports a "URL"
// tab so users with hosted images can still paste a link.
// ==========================================

import { useRef, useState } from 'react';
import { ImagePlus, X, Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/useImageUpload';
import { t, type Locale } from '@/lib/i18n';

export interface ImageUploaderProps {
  /** Current image URLs (controlled). */
  value: string[];
  /** Called when the URL list changes (add, remove, replace). */
  onChange: (urls: string[]) => void;
  /** Multiple files. Default false (single image, e.g. property cover). */
  multiple?: boolean;
  /** Max number of images. 1 for cover, 5 for unit gallery. */
  max?: number;
  /** Section label shown above the dropzone. */
  label?: string;
  /** Hint shown inside the dropzone when empty. */
  hint?: string;
  /** Bilingual locale. */
  locale?: Locale;
  /** Render variant. 'card' (default) or 'compact' (inline). */
  variant?: 'card' | 'compact';
  /** Allow URL paste as an alternative. Default true. */
  allowUrl?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  max = 1,
  label,
  hint,
  locale = 'en',
  variant = 'card',
  allowUrl = true,
}: ImageUploaderProps) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, progress, error, reset: resetUpload } = useImageUpload();

  const atMax = value.length >= max;

  const addUrl = (raw: string) => {
    const url = raw.trim();
    if (!url) return;
    if (multiple) {
      if (atMax) return;
      onChange([...value, url]);
    } else {
      onChange([url]);
    }
    setUrlInput('');
  };

  const removeAt = (i: number) => {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    for (const f of arr) {
      if (atMax) break;
      try {
        const { url } = await upload(f);
        if (multiple) {
          onChange([...value, url]);
        } else {
          onChange([url]);
        }
      } catch {
        /* error state is set inside the hook */
      }
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (atMax) return;
    void handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  // ── Single-image "filled" state — used when 1 image is present
  //    in single mode. Shows the image with a replace/remove overlay.
  const singleFilled = !multiple && value.length > 0;
  const showDropzone = multiple || (!multiple && !singleFilled);

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#D97757]">
            {label}
          </h3>
          <span className="text-[10px] font-semibold text-slate-400">
            {value.length}/{max}
          </span>
        </div>
      )}

      {/* Tabs: Upload | URL */}
      {allowUrl && !atMax && (
        <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'upload' ? 'bg-white text-[#132B25] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {t('uploadTab', locale)}
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tab === 'url' ? 'bg-white text-[#132B25] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            {t('urlTab', locale)}
          </button>
        </div>
      )}

      {/* URL input tab */}
      {tab === 'url' && !atMax && (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(urlInput); } }}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97757]/30 focus:border-[#D97757]"
          />
          <button
            type="button"
            onClick={() => addUrl(urlInput)}
            disabled={!urlInput.trim()}
            className="px-4 py-2.5 bg-[#132B25] hover:bg-[#1A3831] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all"
          >
            {multiple ? t('addGalleryImages', locale) : t('addCoverImage', locale)}
          </button>
        </div>
      )}

      {/* Dropzone — hidden when single + filled, or when at max */}
      {tab === 'upload' && showDropzone && !atMax && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={[
            'relative cursor-pointer rounded-2xl border-2 border-dashed transition-all',
            variant === 'compact' ? 'p-4' : 'p-6',
            dragOver
              ? 'border-[#D97757] bg-orange-50/40'
              : 'border-slate-200 bg-slate-50 hover:border-[#D97757]/60 hover:bg-orange-50/20',
            uploading ? 'pointer-events-none' : '',
          ].join(' ')}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            onChange={e => {
              void handleFiles(e.target.files);
              // reset so re-picking the same file fires onChange
              e.target.value = '';
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center text-center gap-2">
            <div className={`${variant === 'compact' ? 'w-9 h-9' : 'w-12 h-12'} rounded-xl bg-white border border-slate-200 flex items-center justify-center`}>
              {uploading ? (
                <Loader2 className="w-5 h-5 text-[#D97757] animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5 text-[#D97757]" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {uploading ? t('uploading', locale) : (hint ?? t('dropImageHere', locale))}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t('browseFiles', locale)} · JPG, PNG, WEBP · 5 MB max
              </p>
            </div>
            {uploading && progress >= 0 && (
              <div className="w-full max-w-xs mt-1">
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#D97757] rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">{progress}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          <span>{error}</span>
          <button type="button" onClick={resetUpload} className="text-rose-600 hover:underline">
            {t('removeImage', locale)}
          </button>
        </div>
      )}

      {/* Max reached hint */}
      {atMax && (
        <p className="text-[11px] text-slate-500 font-semibold">
          {t('maxImagesReached', locale).replace('{n}', String(max))}
        </p>
      )}

      {/* Thumbnail strip */}
      {value.length > 0 && (
        <div className={[
          'grid gap-2',
          multiple ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-1',
        ].join(' ')}>
          {value.map((url, i) => (
            <div
              key={url + i}
              className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`image-${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // graceful fallback: hide broken image
                  (e.currentTarget as HTMLImageElement).style.opacity = '0.2';
                }}
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1.5 end-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={t('removeImage', locale)}
                title={t('removeImage', locale)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {multiple && (
                <div className="absolute bottom-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  {i + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
