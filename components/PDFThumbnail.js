import { useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export default function PDFThumbnail({ pdfFileId, width = 96, height = 128 }) {
  // Configure PDF.js worker on mount (client-side only)
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';
  }, []);

  if (!pdfFileId) {
    return (
      <div 
        className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center rounded shadow-md"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="text-white text-2xl">📖</span>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded shadow-md overflow-hidden border border-gray-200"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <Document
        file={`/api/books/pdf/${pdfFileId}`}
        loading={
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse" />
        }
        error={
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xl">📚</span>
          </div>
        }
      >
        <Page
          pageNumber={1}
          width={width}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
        />
      </Document>
    </div>
  );
}
