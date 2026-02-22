'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_W = 1200;
const MAX_H = 630;
const WEBP_QUALITY = 0.85;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Resize & convert a File to WebP Blob using the Canvas API (runs in browser). */
async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Falha ao converter imagem para WebP'));
        },
        'image/webp',
        WEBP_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível carregar a imagem'));
    };

    img.src = objectUrl;
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FileInfo {
  name: string;
  originalSize: number;
  optimizedSize: number;
  previewUrl: string; // object URL of the processed WebP blob
}

interface Props {
  /** Current image_url value (URL string or null). */
  value: string | null;
  /** Called whenever the image URL changes (typing URL, upload complete, or clear). */
  onChange: (url: string | null) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImageUploadField({ value, onChange }: Props) {
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  // URL tab: local input state (always tracked even when in upload mode)
  const [urlInput, setUrlInput] = useState(value ?? '');
  // Upload tab: info about the last processed file
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  // Upload progress 0–100
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Mode switching ─────────────────────────────────────────────────────────

  function switchMode(next: 'url' | 'upload') {
    if (next === mode) return;
    setError(null);
    setMode(next);

    if (next === 'url') {
      // Sync URL input with whatever the parent has (could be a Supabase URL from a previous upload)
      setUrlInput(value ?? '');
      setFileInfo(null);
      // Don't call onChange — value is unchanged until user types
    } else {
      // Switching to upload — clear file info; value stays whatever it was
      setFileInfo(null);
    }
  }

  // ── URL mode ──────────────────────────────────────────────────────────────

  function handleUrlChange(v: string) {
    setUrlInput(v);
    setError(null);
    onChange(v.trim() || null);
  }

  // ── Upload mode ───────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_MIME.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG, WebP ou GIF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Arquivo muito grande (${formatBytes(file.size)}). Máximo: 5 MB.`);
      return;
    }

    try {
      setUploading(true);
      setProgress(15);

      // 1. Convert & resize with Canvas API
      const blob = await convertToWebP(file);
      setProgress(50);

      // 2. Create local preview URL for immediate display
      const previewUrl = URL.createObjectURL(blob);
      setFileInfo({ name: file.name, originalSize: file.size, optimizedSize: blob.size, previewUrl });
      setProgress(60);

      // 3. Upload to server (which uploads to Supabase Storage)
      const fd = new FormData();
      const webpName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      fd.append('file', blob, webpName);
      if (value) fd.append('old_url', value); // so the server can delete the old Supabase file

      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      setProgress(90);

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Erro no upload');

      onChange(json.url as string);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
      setFileInfo(null);
      onChange(null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // allow re-selecting the same file
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleClearUpload() {
    setFileInfo(null);
    setError(null);
    onChange(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2.5">
      {/* Tab toggle */}
      <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
        {(['url', 'upload'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m === 'url' ? '🔗 URL' : '⬆️ Upload'}
          </button>
        ))}
      </div>

      {/* ── URL mode ── */}
      {mode === 'url' && (
        <>
          <input
            type="url"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            placeholder="https://exemplo.com/imagem.jpg"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          {urlInput.trim() && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlInput.trim()}
              alt="Preview"
              className="h-24 w-full rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = 'block';
              }}
            />
          )}
        </>
      )}

      {/* ── Upload mode ── */}
      {mode === 'upload' && (
        <div className="space-y-2.5">
          {/* Hidden file input — one instance, always present in upload mode */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileInput}
          />

          {/* Drag-and-drop zone (shown when no file is selected and not uploading) */}
          {!fileInfo && !uploading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className="text-3xl">🖼️</span>
              <p className="text-sm font-medium text-gray-700">
                Arraste uma imagem ou clique para selecionar
              </p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF · Máx. 5 MB</p>
              <p className="text-xs text-gray-400">Convertida para WebP · máx. 1200×630 px</p>
            </div>
          )}

          {/* Progress bar (shown while processing/uploading) */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-block animate-spin">⏳</span>
                <span>Processando e enviando imagem…</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{progress}%</p>
            </div>
          )}

          {/* File info card (shown after successful upload) */}
          {fileInfo && !uploading && (
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileInfo.previewUrl}
                alt="Preview"
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-gray-900">{fileInfo.name}</p>
                <p className="text-xs text-gray-500">
                  Original: {formatBytes(fileInfo.originalSize)}
                  {' → '}
                  <span className="font-medium text-green-700">
                    Otimizado: {formatBytes(fileInfo.optimizedSize)}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-green-700">✓ Upload concluído</p>
              </div>
              <button
                type="button"
                onClick={handleClearUpload}
                title="Remover imagem"
                className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          )}

          {/* "Choose another" link (shown after upload) */}
          {fileInfo && !uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 hover:underline"
            >
              Escolher outra imagem
            </button>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-600">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
}
