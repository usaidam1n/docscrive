'use client';
import React, { useState, useRef, useCallback } from 'react';
import { cn } from '../theme-config';
import { Upload, X, FileCode, Check } from 'lucide-react';
import { Button } from './ui/button';

interface FileUploadProps {
  handleFileChange: (text: string) => void;
}

const FileUpload = ({ handleFileChange }: FileUploadProps) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function convertFileToText(file: File) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const result = event?.target?.result as string | null;
      const base64String = result?.split(',')[1] || '';
      const decodedText = atob(base64String);
      handleFileChange(decodedText);
    };
    reader.readAsDataURL(file);
  }

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      convertFileToText(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName(null);
    handleFileChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        className="hidden"
        accept="*"
      />

      {fileName ? (
        /* File loaded chip */
        <button
          onClick={handleClearFile}
          className="group flex h-8 items-center gap-2 rounded-lg border border-[#2ecc71]/20 bg-[#2ecc71]/10 px-3 text-xs font-medium text-[#2ecc71] transition-all duration-200 hover:border-[#2ecc71]/30 hover:bg-[#2ecc71]/15"
        >
          <Check className="h-3 w-3" />
          <span className="max-w-[120px] truncate font-mono">{fileName}</span>
          <X className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100" />
        </button>
      ) : (
        /* Upload trigger button */
        <button
          onClick={handleClick}
          className="flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-zinc-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-zinc-300"
          title="Upload a file"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload</span>
        </button>
      )}
    </>
  );
};

export default FileUpload;
