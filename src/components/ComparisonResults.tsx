import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, AlertTriangle, XCircle, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { ComparisonRow, ColumnMapping } from '../App';

interface ComparisonResultsProps {
  results: ComparisonRow[];
  columnMappings: ColumnMapping[];
  onReset: () => void;
  onBack: () => void;
}

export function ComparisonResults({ 
  results, 
  columnMappings, 
  onReset, 
  onBack 
}: ComparisonResultsProps) {
  const [filter, setFilter] = useState<'all' | 'match' | 'different' | 'missing'>('all');
  const [showDifferences, setShowDifferences] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const filteredResults = results.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'match') return result.type === 'match';
    if (filter === 'different') return result.type === 'different';
    if (filter === 'missing') return result.type === 'missing-in-compare' || result.type === 'missing-in-source';
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const stats = {
    total: results.length,
    matches: results.filter(r => r.type === 'match').length,
    differences: results.filter(r => r.type === 'different').length,
    missingInCompare: results.filter(r => r.type === 'missing-in-compare').length,
    missingInSource: results.filter(r => r.type === 'missing-in-source').length
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const getRowClass = (type: ComparisonRow['type']) => {
    switch (type) {
      case 'match':
        return 'bg-green-50 border-green-200';
      case 'different':
        return 'bg-yellow-50 border-yellow-200';
      case 'missing-in-compare':
        return 'bg-red-50 border-red-200';
      case 'missing-in-source':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getStatusIcon = (type: ComparisonRow['type']) => {
    switch (type) {
      case 'match':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'different':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'missing-in-compare':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'missing-in-source':
        return <XCircle className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (type: ComparisonRow['type']) => {
    switch (type) {
      case 'match':
        return 'Match';
      case 'different':
        return 'Different';
      case 'missing-in-compare':
        return 'Missing in Compare';
      case 'missing-in-source':
        return 'Missing in Source';
      default:
        return 'Unknown';
    }
  };

  // Get all unique columns for display
  const allColumns = new Set<string>();
  columnMappings.forEach(mapping => {
    allColumns.add(mapping.sourceColumn);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Mapping
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Comparison Results</h2>
          <p className="text-gray-600 mt-1">Detailed analysis of your CSV files</p>
        </div>
        
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Start Over
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Rows</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.matches}</div>
          <div className="text-sm text-green-600">Matches</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.differences}</div>
          <div className="text-sm text-yellow-600">Differences</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-700">{stats.missingInCompare}</div>
          <div className="text-sm text-red-600">Missing in Compare</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.missingInSource}</div>
          <div className="text-sm text-blue-600">Missing in Source</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Results ({stats.total})</option>
            <option value="match">Matches ({stats.matches})</option>
            <option value="different">Differences ({stats.differences})</option>
            <option value="missing">Missing ({stats.missingInCompare + stats.missingInSource})</option>
          </select>
          
          <label className="text-sm font-medium text-gray-700">Show:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <button
          onClick={() => setShowDifferences(!showDifferences)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          {showDifferences ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showDifferences ? 'Hide' : 'Show'} Differences
        </button>
      </div>

      {/* Pagination Info */}
      {filteredResults.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-white px-4 py-3 rounded-lg border border-gray-200">
          <div>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredResults.length)} of {filteredResults.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-gray-400">...</span>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="w-8 h-8 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {Array.from(allColumns).map(column => (
                  <th key={column} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedResults.map((result, index) => (
                <tr key={startIndex + index} className={getRowClass(result.type)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.type)}
                      <span className="text-sm font-medium">
                        {getStatusText(result.type)}
                      </span>
                    </div>
                  </td>
                  {Array.from(allColumns).map(column => {
                    const mapping = columnMappings.find(m => m.sourceColumn === column);
                    
                    // Use unified data if available (for match/different rows)
                    if (result.unifiedData && result.unifiedData[column]) {
                      const unified = result.unifiedData[column];
                      
                      return (
                        <td key={column} className="px-4 py-3">
                          {unified.isDifferent && showDifferences ? (
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-blue-700 text-xs">Source:</span>
                                </div>
                                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">
                                  {unified.source || '(empty)'}
                                </div>
                              </div>
                              <div className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-orange-700 text-xs">Compare:</span>
                                </div>
                                <div className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-mono">
                                  {unified.compare || '(empty)'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900 font-mono">
                              {unified.source || unified.compare || '(empty)'}
                            </div>
                          )}
                        </td>
                      );
                    }
                    
                    // Fallback for missing rows
                    const sourceValue = result.sourceData?.[column] || '';
                    const compareValue = result.compareData?.[mapping?.compareColumn || ''] || '';
                    
                    return (
                      <td key={column} className="px-4 py-3">
                        <div className="text-sm text-gray-900 font-mono">
                          {result.type === 'missing-in-compare' 
                            ? sourceValue 
                            : result.type === 'missing-in-source'
                            ? compareValue
                            : sourceValue || compareValue}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paginatedResults.length === 0 && filteredResults.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            No results match the current filter criteria.
          </div>
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-lg border border-gray-200">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-md transition-colors ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-10 h-10 rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            {totalPages > 7 && currentPage < totalPages - 3 && (
              <>
                <span className="text-gray-400 px-2">...</span>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="w-10 h-10 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-md transition-colors ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}