import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ColumnMapper } from './components/ColumnMapper';
import { ComparisonResults } from './components/ComparisonResults';
import { FileText, ArrowRight } from 'lucide-react';

export interface CSVData {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  sourceColumn: string;
  compareColumn: string;
}

export interface ComparisonRow {
  type: 'match' | 'different' | 'missing-in-compare' | 'missing-in-source';
  sourceData?: { [key: string]: string };
  compareData?: { [key: string]: string };
  differences?: string[];
  unifiedData?: { [key: string]: { source: string; compare: string; isDifferent: boolean } };
}

export interface ComparisonSettings {
  numericPrecision: number; // Number of decimal places to consider
  ignoreCase: boolean; // Whether to ignore case for text comparisons
  trimWhitespace: boolean; // Whether to trim whitespace
}

function App() {
  const [sourceFile, setSourceFile] = useState<CSVData | null>(null);
  const [compareFile, setCompareFile] = useState<CSVData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [comparisonResults, setComparisonResults] = useState<ComparisonRow[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'results'>('upload');
  
  // Comparison settings with defaults
  const [comparisonSettings, setComparisonSettings] = useState<ComparisonSettings>({
    numericPrecision: 2, // Default to 2 decimal places
    ignoreCase: true,
    trimWhitespace: true
  });

  const handleSourceFileUpload = (data: CSVData) => {
    setSourceFile(data);
    setComparisonResults([]);
    if (compareFile) {
      setCurrentStep('mapping');
    }
  };

  const handleCompareFileUpload = (data: CSVData) => {
    setCompareFile(data);
    setComparisonResults([]);
    if (sourceFile) {
      setCurrentStep('mapping');
    }
  };

  const handleColumnMappingComplete = (mappings: ColumnMapping[]) => {
    setColumnMappings(mappings);
    performComparison(mappings);
  };

  const performComparison = (mappings: ColumnMapping[]) => {
    if (!sourceFile || !compareFile) return;

    // Helper function to normalize numeric values for comparison
    const normalizeValue = (value: string, precision?: number, ignoreCase?: boolean): string => {
      if (!value || value.trim() === '') return '';
      
      let trimmedValue = comparisonSettings.trimWhitespace ? value.trim() : value;
      
      // Simple check: if the value ends with .0, remove it
      if (trimmedValue.endsWith('.0')) {
        trimmedValue = trimmedValue.slice(0, -2);
      }
      
      // Remove common formatting from numbers
      // Remove currency symbols
      let cleanedValue = trimmedValue.replace(/[$€£¥₹]/g, '');
      
      // Remove commas used as thousands separators
      cleanedValue = cleanedValue.replace(/,/g, '');
      
      // Remove spaces that might be used as thousands separators
      cleanedValue = cleanedValue.replace(/\s/g, '');
      
      // Try to parse as a number
      const numValue = parseFloat(cleanedValue);
      
      if (!isNaN(numValue) && isFinite(numValue)) {
        // If precision is specified, round to that precision
        if (precision !== undefined && precision >= 0) {
          const rounded = Math.round(numValue * Math.pow(10, precision)) / Math.pow(10, precision);
          return rounded.toString();
        }
        
        // For key generation without specific precision, use default precision to avoid floating point issues
        const defaultPrecision = comparisonSettings.numericPrecision;
        const rounded = Math.round(numValue * Math.pow(10, defaultPrecision)) / Math.pow(10, defaultPrecision);
        return rounded.toString();
      }
      
      // For non-numeric values
      const shouldIgnoreCase = ignoreCase !== undefined ? ignoreCase : comparisonSettings.ignoreCase;
      if (shouldIgnoreCase) {
        return trimmedValue.toLowerCase();
      }
      return trimmedValue;
    };

    // Helper function to compare two values with precision
    const valuesAreEqual = (val1: string, val2: string): boolean => {
      const normalized1 = normalizeValue(val1, comparisonSettings.numericPrecision, comparisonSettings.ignoreCase);
      const normalized2 = normalizeValue(val2, comparisonSettings.numericPrecision, comparisonSettings.ignoreCase);
      
      // Try numeric comparison first
      const num1 = parseFloat(normalized1);
      const num2 = parseFloat(normalized2);
      
      if (!isNaN(num1) && !isNaN(num2)) {
        // For numeric values, use precision-based comparison
        const precision = Math.pow(10, -comparisonSettings.numericPrecision);
        return Math.abs(num1 - num2) < precision;
      }
      
      // For non-numeric values, use string comparison
      return normalized1 === normalized2;
    };
    
    const results: ComparisonRow[] = [];
    const sourceMap = new Map<string, { [key: string]: string }>();
    const compareMap = new Map<string, { [key: string]: string }>();

    // Create maps for faster lookup
    sourceFile.rows.forEach(row => {
      const rowData: { [key: string]: string } = {};
      sourceFile.headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });
      
      // Create a key based on mapped columns - USE NORMALIZED VALUES WITH PRECISION
      const keyParts: string[] = [];
      mappings.forEach(mapping => {
        const value = rowData[mapping.sourceColumn] || '';
        // Apply precision normalization to prevent floating point issues
        keyParts.push(normalizeValue(value, comparisonSettings.numericPrecision, comparisonSettings.ignoreCase));
      });
      const key = keyParts.join('|');
      sourceMap.set(key, rowData);
    });

    compareFile.rows.forEach(row => {
      const rowData: { [key: string]: string } = {};
      compareFile.headers.forEach((header, index) => {
        rowData[header] = row[index] || '';
      });
      
      // Create a key based on mapped columns - USE NORMALIZED VALUES WITH PRECISION
      const keyParts: string[] = [];
      mappings.forEach(mapping => {
        const value = rowData[mapping.compareColumn] || '';
        // Apply precision normalization to prevent floating point issues
        keyParts.push(normalizeValue(value, comparisonSettings.numericPrecision, comparisonSettings.ignoreCase));
      });
      const key = keyParts.join('|');
      compareMap.set(key, rowData);
    });

    // Find matches, differences, and missing rows
    const processedKeys = new Set<string>();

    sourceMap.forEach((sourceRow, key) => {
      processedKeys.add(key);
      const compareRow = compareMap.get(key);

      if (!compareRow) {
        results.push({
          type: 'missing-in-compare',
          sourceData: sourceRow
        });
      } else {
        // Check for differences
        const differences: string[] = [];
        const unifiedData: { [key: string]: { source: string; compare: string; isDifferent: boolean } } = {};
        
        mappings.forEach(mapping => {
          const sourceValue = sourceRow[mapping.sourceColumn] || '';
          const compareValue = compareRow[mapping.compareColumn] || '';
          const areEqual = valuesAreEqual(sourceValue, compareValue);
          
          unifiedData[mapping.sourceColumn] = {
            source: sourceValue,
            compare: compareValue,
            isDifferent: !areEqual
          };
          
          if (!areEqual && (sourceValue || compareValue)) {
            differences.push(mapping.sourceColumn);
          }
        });

        results.push({
          type: differences.length > 0 ? 'different' : 'match',
          sourceData: sourceRow,
          compareData: compareRow,
          differences: differences.length > 0 ? differences : undefined,
          unifiedData
        });
      }
    });

    // Find rows that exist only in compare file
    compareMap.forEach((compareRow, key) => {
      if (!processedKeys.has(key)) {
        results.push({
          type: 'missing-in-source',
          compareData: compareRow
        });
      }
    });

    setComparisonResults(results);
    setCurrentStep('results');
  };

  const resetApp = () => {
    setSourceFile(null);
    setCompareFile(null);
    setColumnMappings([]);
    setComparisonResults([]);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">CSV File Comparator</h1>
          </div>
          <p className="text-gray-600 text-lg">Upload, map, and compare CSV files with precision</p>
        </header>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              currentStep === 'upload' ? 'bg-blue-600 text-white' : 
              currentStep === 'mapping' || currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <span className="text-sm font-medium text-gray-600">Upload Files</span>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              currentStep === 'mapping' ? 'bg-blue-600 text-white' : 
              currentStep === 'results' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className="text-sm font-medium text-gray-600">Map Columns</span>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              currentStep === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              3
            </div>
            <span className="text-sm font-medium text-gray-600">View Results</span>
          </div>
        </div>

        {currentStep === 'upload' && (
          <FileUpload
            sourceFile={sourceFile}
            compareFile={compareFile}
            onSourceFileUpload={handleSourceFileUpload}
            onCompareFileUpload={handleCompareFileUpload}
          />
        )}

        {currentStep === 'mapping' && sourceFile && compareFile && (
          <>
            {/* Comparison Settings */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Comparison Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numeric Precision (decimal places)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={comparisonSettings.numericPrecision}
                    onChange={(e) => setComparisonSettings({
                      ...comparisonSettings,
                      numericPrecision: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    e.g., 2 means 1.234 ≈ 1.235
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={comparisonSettings.ignoreCase}
                      onChange={(e) => setComparisonSettings({
                        ...comparisonSettings,
                        ignoreCase: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Ignore Case
                  </label>
                  <p className="text-xs text-gray-500">
                    Treat "ABC" and "abc" as equal
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      checked={comparisonSettings.trimWhitespace}
                      onChange={(e) => setComparisonSettings({
                        ...comparisonSettings,
                        trimWhitespace: e.target.checked
                      })}
                      className="mr-2"
                    />
                    Trim Whitespace
                  </label>
                  <p className="text-xs text-gray-500">
                    Remove leading/trailing spaces
                  </p>
                </div>
              </div>
            </div>

            <ColumnMapper
              sourceHeaders={sourceFile.headers}
              compareHeaders={compareFile.headers}
              onMappingComplete={handleColumnMappingComplete}
              onBack={() => setCurrentStep('upload')}
            />
          </>
        )}

        {currentStep === 'results' && (
          <ComparisonResults
            results={comparisonResults}
            columnMappings={columnMappings}
            onReset={resetApp}
            onBack={() => setCurrentStep('mapping')}
          />
        )}
      </div>
    </div>
  );
}

export default App;