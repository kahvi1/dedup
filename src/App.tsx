import React, { useState, useRef, useEffect } from 'react';
import { ActivityLogProvider, useActivityLog } from './context/ActivityLogContext';
import { ActivityLog } from './components/ActivityLog';
import { FileEntry } from './types';

declare global {
  interface Window {
    electronAPI: {
      getPathForFile: (file: File) => string;
    };
  }
}

let cachedCanvas: HTMLCanvasElement | null = null;
function getTextWidth(text: string, font: string): number {
  if (!cachedCanvas) cachedCanvas = document.createElement('canvas');
  const ctx = cachedCanvas.getContext('2d');
  if (!ctx) return 0;
  ctx.font = font;
  return ctx.measureText(text).width;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function FileItem({ entry }: { entry: FileEntry }) {
  const nameRef = useRef<HTMLSpanElement>(null);
  const [displayName, setDisplayName] = useState(entry.name);

  useEffect(() => {
    const nameSpan = nameRef.current;
    if (!nameSpan) return;

    const availableWidth = nameSpan.clientWidth || nameSpan.parentElement!.clientWidth - 20;
    const font = getComputedStyle(nameSpan).font;

    if (getTextWidth(entry.name, font) <= availableWidth) {
      setDisplayName(entry.name);
      return;
    }

    let truncated = entry.name;
    while (truncated.length > 0 && getTextWidth(truncated + '...', font) > availableWidth) {
      truncated = truncated.slice(0, -1);
    }
    setDisplayName(truncated + '...');
  }, [entry.name]);

  return (
    <li className="px-2.5 py-2 rounded-md mb-1.5 bg-[#2a2a2a] text-[13px] whitespace-nowrap cursor-default hover:bg-[#333]" title={entry.name}>
      <span ref={nameRef} className="block">{displayName}</span>
      <span className="block text-[11px] text-[#8a8a8a] mt-0.5">{formatBytes(entry.size)}</span>
    </li>
  );
}

function MainLayout() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'activity'>('files');
  const [isDragOver, setIsDragOver] = useState(false);
  const { logs, logSuccess, logWarning } = useActivityLog();

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) {
      logWarning('Drop event ignored', 'No valid files detected in the dropped payload.');
      return;
    }

    const newEntries: FileEntry[] = dropped.map((file) => ({
      name: file.name,
      path: window.electronAPI ? window.electronAPI.getPathForFile(file) : '',
      size: file.size,
      addedAt: Date.now(),
    }));

    setFiles((prev) => [...prev, ...newEntries]);

    const totalBytes = newEntries.reduce((sum, f) => sum + f.size, 0);
    if (newEntries.length === 1) {
      const single = newEntries[0];
      logSuccess(
        `Ingested "${single.name}"`,
        `${formatBytes(single.size)}${single.path ? ` • ${single.path}` : ''}`,
        { size: formatBytes(single.size) }
      );
    } else {
      logSuccess(
        `Ingested ${newEntries.length} files`,
        `Total size: ${formatBytes(totalBytes)}`,
        {
          count: newEntries.length,
          files: newEntries.slice(0, 5).map((f) => f.name),
        }
      );
    }
  };

  const sortedFiles = [...files].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div className="flex h-screen">
      <aside id="sidebar" className="w-[340px] max-w-[600px] min-w-[240px] resize-x overflow-hidden border-r border-[#3a3a3a] p-4 flex flex-col">
        <div className="flex gap-1.5 border-b border-[#333] pb-2.5 mb-3">
          <button
            type="button"
            className={`bg-transparent border-none text-[13px] font-semibold py-1.5 px-2.5 rounded-md cursor-pointer flex items-center gap-1.5 transition-colors duration-150 ${activeTab === 'files' ? 'bg-[#333333] text-white' : 'text-[#8a8a8a] hover:bg-[#2a2a2a] hover:text-[#d1d1d1]'}`}
            onClick={() => setActiveTab('files')}
          >
            Files {files.length > 0 && <span className={`text-[11px] px-1.5 py-px rounded-full ${activeTab === 'files' ? 'bg-blue-600 text-white' : 'bg-[#444] text-[#bbb]'}`}>{files.length}</span>}
          </button>
          <button
            type="button"
            className={`bg-transparent border-none text-[13px] font-semibold py-1.5 px-2.5 rounded-md cursor-pointer flex items-center gap-1.5 transition-colors duration-150 ${activeTab === 'activity' ? 'bg-[#333333] text-white' : 'text-[#8a8a8a] hover:bg-[#2a2a2a] hover:text-[#d1d1d1]'}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity Log {logs.length > 0 && <span className={`text-[11px] px-1.5 py-px rounded-full ${activeTab === 'activity' ? 'bg-blue-600 text-white' : 'bg-[#444] text-[#bbb]'}`}>{logs.length}</span>}
          </button>
        </div>

        {activeTab === 'files' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {sortedFiles.length === 0 ? (
              <div className="text-[#777] text-[13px] text-center mt-10 leading-relaxed">
                <p>No files ingested yet.</p>
                <span className="block text-[11px] text-[#555] mt-1">Drop files into the dropzone to add them here.</span>
              </div>
            ) : (
              <ul id="file-list" className="list-none m-0 p-0 overflow-y-auto flex-1">
                {sortedFiles.map((entry, index) => (
                  <FileItem key={`${entry.path || entry.name}-${index}`} entry={entry} />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <ActivityLog />
        )}
      </aside>

      <main
        id="dropzone"
        className={`flex-1 flex flex-col items-center justify-center text-[#9a9a9a] border-2 border-dashed m-3 rounded-xl transition-all duration-150 ${isDragOver ? 'bg-[#26313d] border-[#56a2e8]' : 'border-transparent'}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag and drop any file here</p>
        <p className="text-[12px] text-[#6a6a6a]">Any format, any size</p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ActivityLogProvider>
      <MainLayout />
    </ActivityLogProvider>
  );
}