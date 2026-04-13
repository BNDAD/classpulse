// src/components/FileUploader.tsx — 파일 업로드 + 텍스트 추출 (클라이언트 사이드)
// 지원: .txt, .pdf, .docx
'use client';

import { useState, useRef, useCallback } from 'react';

interface FileUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  accept?: string;
  accentColor?: string; // 'primary' | 'amber'
}

// PDF.js CDN
const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
// Mammoth CDN (docx → text)
const MAMMOTH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function extractTextFromPdf(file: File): Promise<string> {
  await loadScript(PDFJS_CDN);
  const pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

async function extractTextFromDocx(file: File): Promise<string> {
  await loadScript(MAMMOTH_CDN);
  const mammoth = (window as any).mammoth;

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromTxt(file: File): Promise<string> {
  return file.text();
}

export default function FileUploader({
  onTextExtracted,
  accept = '.txt,.pdf,.docx',
  accentColor = 'primary',
}: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      let text = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'txt') {
        text = await extractTextFromTxt(file);
      } else if (ext === 'pdf') {
        text = await extractTextFromPdf(file);
      } else if (ext === 'docx') {
        text = await extractTextFromDocx(file);
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. (txt, pdf, docx만 가능)');
      }

      if (!text.trim()) {
        throw new Error('파일에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF일 수 있습니다.');
      }

      onTextExtracted(text.trim(), file.name);
    } catch (e: any) {
      setError(e.message || '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [onTextExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const borderColor = accentColor === 'amber' ? 'border-amber-300' : 'border-primary-300';
  const bgColor = accentColor === 'amber' ? 'bg-amber-50' : 'bg-primary-50';
  const textColor = accentColor === 'amber' ? 'text-amber-600' : 'text-primary-600';

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragging ? `${borderColor} ${bgColor}` : 'border-[rgba(26,26,26,0.06)] hover:border-[rgba(26,26,26,0.10)] hover:bg-cream-light'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <div className={`w-5 h-5 border-2 border-[rgba(26,26,26,0.10)] border-t-${accentColor}-600 rounded-full animate-spin`} />
            <span className="text-sm text-[var(--text-secondary)]">파일에서 텍스트 추출 중...</span>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
            <p className="text-sm text-[var(--text-secondary)]">
              파일을 드래그하거나 <span className={`${textColor} font-semibold`}>클릭하여 업로드</span>
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              지원 형식: TXT, PDF, DOCX (최대 10MB)
            </p>
          </>
        )}
      </div>

      {fileName && !loading && !error && (
        <div className={`flex items-center gap-2 text-xs ${textColor} ${bgColor} px-3 py-2 rounded-lg`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span><strong>{fileName}</strong>에서 텍스트를 추출했습니다</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
