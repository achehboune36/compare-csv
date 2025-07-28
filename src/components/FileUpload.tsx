import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { CSVData } from '../App';

interface FileUploadProps {
  sourceFile: CSVData | null;
  compareFile: CSVData | null;
  onSourceFileUpload: (data: CSVData) => void;
  onCompareFileUpload: (data: CSVData) => void;
}

export function FileUpload({ 
  sourceFile, 
  compareFile, 
  onSourceFileUpload, 
  onCompareFileUpload 
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState<'source' | 'compare' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (content: string): CSVData => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );

    return { headers, rows };
  };

  const handleFile = useCallback((file: File, type: 'source' | 'compare') => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const csvData = parseCSV(content);
        
        if (type === 'source') {
          onSourceFileUpload(csvData);
        } else {
          onCompareFileUpload(csvData);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing CSV file');
      }
    };
    reader.readAsText(file);
  }, [onSourceFileUpload, onCompareFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent, type: 'source' | 'compare') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0], type);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'source' | 'compare') => {
    e.preventDefault();
    setDragOver(type);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'compare') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0], type);
    }
  };

  const UploadArea = ({ type, file, title, description }: { 
    type: 'source' | 'compare'; 
    file: CSVData | null; 
    title: string; 
    description: string;
  }) => (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
        dragOver === type
          ? 'border-blue-500 bg-blue-50'
          : file
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
      }`}
      onDrop={(e) => handleDrop(e, type)}
      onDragOver={(e) => handleDragOver(e, type)}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept=".csv"
        onChange={(e) => handleFileInput(e, type)}
        className="hidden"
        id={`${type}-file-input`}
      />
      
      <div className="flex flex-col items-center space-y-4">
        {file ? (
          <>
            <CheckCircle className="w-12 h-12 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">{title} File Loaded</h3>
              <p className="text-green-600 mt-1">
                {file.headers.length} columns, {file.rows.length} rows
              </p>
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700 mb-2">Columns:</p>
                <div className="flex flex-wrap gap-2">
                  {file.headers.slice(0, 5).map((header, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {header}
                    </span>
                  ))}
                  {file.headers.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                      +{file.headers.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              dragOver === type ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {dragOver === type ? (
                <Upload className="w-6 h-6 text-blue-600" />
              ) : (
                <FileText className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
            <label
              htmlFor={`${type}-file-input`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose CSV File
            </label>
            <p className="text-xs text-gray-500">or drag and drop your CSV file here</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <UploadArea
          type="source"
          file={sourceFile}
          title="Source File"
          description="Upload the original CSV file you want to compare from"
        />
        
        <UploadArea
          type="compare"
          file={compareFile}
          title="Compare File"
          description="Upload the CSV file you want to compare against the source"
        />
      </div>

      {sourceFile && compareFile && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">
              Both files uploaded successfully! Ready to map columns.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}