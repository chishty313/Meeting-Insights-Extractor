
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFile = useCallback((file: File | null) => {
    if (file && file.type.startsWith('audio/')) {
      setFileName(file.name);
      onFileChange(file);
    } else {
      setFileName('');
      onFileChange(null);
      // Optional: Add user feedback for invalid file type
    }
  }, [onFileChange]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <label 
        className={`flex justify-center w-full h-32 px-4 transition bg-slate-900 border-2 ${isDragging ? 'border-cyan-400' : 'border-slate-700'} border-dashed rounded-md appearance-none cursor-pointer hover:border-slate-500 focus:outline-none`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <span className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="font-medium text-slate-400">
            {fileName || (
              <>
                Drop an audio file, or <span className="text-cyan-400 underline">browse</span>
              </>
            )}
          </span>
        </span>
        <input type="file" name="file_upload" className="hidden" accept="audio/*" onChange={handleChange} />
      </label>
    </div>
  );
};

export default FileUpload;
