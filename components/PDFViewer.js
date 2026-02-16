import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PDFViewer({ pdfUrl, fileName, totalPages }) {
  const [numPages, setNumPages] = useState(totalPages || null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageWidth, setPageWidth] = useState(null);

  // Configure PDF.js worker on mount (client-side only)
  useEffect(() => {
    // Use locally served worker file
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';
    
    // Set initial page width based on screen size
    const updatePageWidth = () => {
      if (window.innerWidth < 640) {
        // Mobile: use full width minus padding
        setPageWidth(window.innerWidth - 32);
      } else {
        // Desktop: let PDF render at natural size
        setPageWidth(null);
      }
    };
    
    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    
    return () => window.removeEventListener('resize', updatePageWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('PDF load error:', error);
    setLoading(false);
    setError('Failed to load PDF. Please try again.');
  }

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      return Math.min(Math.max(1, newPage), numPages);
    });
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName || 'document.pdf';
    link.click();
  };

  return (
    <div className="pdf-viewer-container">
      {/* Controls Bar */}
      <div className="bg-gray-100 border-b border-gray-300 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Page Navigation */}
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">← Previous</span>
            <span className="sm:hidden">←</span>
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageNumber}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= numPages) {
                  setPageNumber(page);
                }
              }}
              className="w-12 sm:w-16 px-1 sm:px-2 py-2 border border-gray-300 rounded text-center text-sm sm:text-base"
            />
            <span className="text-gray-600 text-sm sm:text-base">of {numPages || '?'}</span>
          </div>
          
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm sm:text-base"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition text-sm sm:text-base"
          >
            −
          </button>
          <span className="px-3 py-2 bg-white border border-gray-300 rounded min-w-[70px] sm:min-w-[80px] text-center text-sm sm:text-base">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition text-sm sm:text-base"
          >
            +
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">Download</span>
        </button>
      </div>

      {/* PDF Display */}
      <div 
        className="pdf-display bg-gray-50 p-2 sm:p-4 md:p-8 overflow-auto" 
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-red-600 text-sm sm:text-base">{error}</p>
          </div>
        )}

        {!error && (
          <div className="flex justify-center">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg sm:shadow-2xl max-w-full"
                width={pageWidth}
              />
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
