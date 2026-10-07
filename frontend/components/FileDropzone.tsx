'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, File, Image as ImageIcon, Video, Music, X, AlertCircle } from 'lucide-react';
import { calculateClientSha256, ClientHashResult } from '../lib/hashing';
import { HashDisplay } from './HashDisplay';

interface FileDropzoneProps {
  onFileSelect: (file: File, hashResult: ClientHashResult) => void;
  onClear?: () => void;
  disabled?: boolean;
}

export function FileDropzone({ onFileSelect, onClear, disabled = false }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientHash, setClientHash] = useState<ClientHashResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hashingLoading, setHashingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const processFile = async (file: File) => {
    setError(null);

    // Limit check (50 MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50 MB limit.');
      return;
    }

    try {
      setHashingLoading(true);
      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      // Calculate SHA-256 client-side using Web Crypto API
      const hashResult = await calculateClientSha256(file);
      setClientHash(hashResult);
      onFileSelect(file, hashResult);
    } catch (err: any) {
      setError(err.message || 'Failed to process and hash the selected file.');
    } finally {
      setHashingLoading(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setClientHash(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-cyber-cyan" />;
    if (mime.startsWith('video/')) return <Video className="w-8 h-8 text-purple-400" />;
    if (mime.startsWith('audio/')) return <Music className="w-8 h-8 text-emerald-400" />;
    return <File className="w-8 h-8 text-zinc-400" />;
  };

  return (
    <div className="w-full space-y-4">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyber-cyan ${
            isDragging
              ? 'border-cyber-cyan bg-cyber-cyan/5 scale-[1.01]'
              : 'border-surface-border bg-surface-card/40 hover:bg-surface-card hover:border-zinc-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
            aria-label="Upload media file"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan mb-1">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div>
              <p className="text-base font-medium text-white">
                Drop media file here or <span className="text-cyber-cyan underline">browse</span>
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Images (JPEG, PNG, WebP), Videos (MP4, MOV, WebM), Audio (MP3, WAV, AAC)
              </p>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono pt-2">
              <span className="px-2 py-0.5 rounded bg-surface border border-surface-border">Max 50MB</span>
              <span className="px-2 py-0.5 rounded bg-surface border border-surface-border">Client-Side SHA-256</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {previewUrl ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-border bg-black shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="File preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-surface border border-surface-border flex items-center justify-center shrink-0">
                  {getFileIcon(selectedFile.type)}
                </div>
              )}

              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md" title={selectedFile.name}>
                  {selectedFile.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>{selectedFile.type || 'unknown format'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              disabled={disabled}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-surface-border rounded-md transition-colors"
              title="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {hashingLoading ? (
            <div className="flex items-center space-x-2 text-xs text-cyber-cyan font-mono py-2">
              <div className="w-3 h-3 rounded-full border-2 border-cyber-cyan border-t-transparent animate-spin" />
              <span>Calculating client-side SHA-256 via Web Crypto API...</span>
            </div>
          ) : clientHash ? (
            <HashDisplay hash={clientHash.hash} label="Client-Side Cryptographic Fingerprint" />
          ) : null}
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
