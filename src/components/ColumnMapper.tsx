import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Link, Unlink, Play } from 'lucide-react';
import { ColumnMapping } from '../App';

interface ColumnMapperProps {
  sourceHeaders: string[];
  compareHeaders: string[];
  onMappingComplete: (mappings: ColumnMapping[]) => void;
  onBack: () => void;
}

export function ColumnMapper({ 
  sourceHeaders, 
  compareHeaders, 
  onMappingComplete,
  onBack 
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [selectedSourceColumn, setSelectedSourceColumn] = useState<string | null>(null);

  // Auto-match columns with similar names
  useEffect(() => {
    const autoMappings: ColumnMapping[] = [];
    
    sourceHeaders.forEach(sourceCol => {
      const exactMatch = compareHeaders.find(compareCol => 
        compareCol.toLowerCase() === sourceCol.toLowerCase()
      );
      
      if (exactMatch) {
        autoMappings.push({
          sourceColumn: sourceCol,
          compareColumn: exactMatch
        });
      } else {
        // Look for partial matches
        const partialMatch = compareHeaders.find(compareCol => {
          const sourceLower = sourceCol.toLowerCase();
          const compareLower = compareCol.toLowerCase();
          return sourceLower.includes(compareLower) || compareLower.includes(sourceLower);
        });
        
        if (partialMatch) {
          autoMappings.push({
            sourceColumn: sourceCol,
            compareColumn: partialMatch
          });
        }
      }
    });

    setMappings(autoMappings);
  }, [sourceHeaders, compareHeaders]);

  const handleSourceColumnClick = (column: string) => {
    if (selectedSourceColumn === column) {
      setSelectedSourceColumn(null);
    } else {
      setSelectedSourceColumn(column);
    }
  };

  const handleCompareColumnClick = (column: string) => {
    if (!selectedSourceColumn) return;

    const existingMappingIndex = mappings.findIndex(m => m.sourceColumn === selectedSourceColumn);
    const newMapping = {
      sourceColumn: selectedSourceColumn,
      compareColumn: column
    };

    if (existingMappingIndex >= 0) {
      const newMappings = [...mappings];
      newMappings[existingMappingIndex] = newMapping;
      setMappings(newMappings);
    } else {
      setMappings([...mappings, newMapping]);
    }

    setSelectedSourceColumn(null);
  };

  const removeMapping = (sourceColumn: string) => {
    setMappings(mappings.filter(m => m.sourceColumn !== sourceColumn));
  };

  const getMappedCompareColumn = (sourceColumn: string) => {
    const mapping = mappings.find(m => m.sourceColumn === sourceColumn);
    return mapping?.compareColumn;
  };

  const isCompareColumnMapped = (compareColumn: string) => {
    return mappings.some(m => m.compareColumn === compareColumn);
  };

  const handleProceed = () => {
    if (mappings.length === 0) {
      alert('Please map at least one column to proceed with comparison.');
      return;
    }
    onMappingComplete(mappings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Map Columns</h2>
          <p className="text-gray-600 mt-1">Link equivalent columns between your files</p>
        </div>
        
        <div></div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-blue-800">
          <strong>Instructions:</strong> Click on a column from the source file, then click on the corresponding column from the compare file to create a mapping. 
          Mapped columns will be used to identify matching rows during comparison.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Source Columns */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            Source File Columns
          </h3>
          <div className="space-y-2">
            {sourceHeaders.map((header, index) => {
              const mappedColumn = getMappedCompareColumn(header);
              const isSelected = selectedSourceColumn === header;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : mappedColumn
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSourceColumnClick(header)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{header}</span>
                    {mappedColumn && (
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-green-600" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMapping(header);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {mappedColumn && (
                    <div className="mt-2 text-sm text-gray-600">
                      Mapped to: <span className="font-medium">{mappedColumn}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mapping Visualization */}
        <div className="flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-gray-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {mappings.length} column{mappings.length !== 1 ? 's' : ''} mapped
              </p>
              {selectedSourceColumn && (
                <p className="text-xs text-blue-600">
                  Click a compare column to map with<br />
                  <strong>{selectedSourceColumn}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Compare Columns */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-600 rounded"></div>
            Compare File Columns
          </h3>
          <div className="space-y-2">
            {compareHeaders.map((header, index) => {
              const isMapped = isCompareColumnMapped(header);
              const canMap = selectedSourceColumn && !isMapped;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    canMap
                      ? 'border-blue-300 bg-blue-25 cursor-pointer hover:border-blue-400 hover:bg-blue-50'
                      : isMapped
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white'
                  } ${!selectedSourceColumn && !isMapped ? 'opacity-60' : ''}`}
                  onClick={() => canMap && handleCompareColumnClick(header)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{header}</span>
                    {isMapped && <Link className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center pt-6">
        <button
          onClick={handleProceed}
          disabled={mappings.length === 0}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            mappings.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Play className="w-4 h-4" />
          Compare Files ({mappings.length} mapping{mappings.length !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}