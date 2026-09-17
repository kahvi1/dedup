import React, { useState, useRef, useEffect } from 'react';
import { ActivityLogProvider, useActivityLog } from './context/ActivityLogContext';
import { ActivityLog } from './components/ActivityLog';
import { FileEntry } from './types';

// Expose the preload script's custom API to the global Window object
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

    // Use the non-null assertion operator (!) since parentElement is guaranteed here
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
    <li className="file-item" title={entry.name}>
      <span ref={nameRef} className="file-name">{displayName}</span>
      <span className="file-size">{formatBytes(entry.size)}</span>
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
    <div className="app">
      <aside id="sidebar" className="sidebar">
        <div className="sidebar-tabs">
          <button
            type="button"
            className={`sidebar-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files {files.length > 0 && <span className="tab-badge">{files.length}</span>}
          </button>
          <button
            type="button"
            className={`sidebar-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity Log {logs.length > 0 && <span className="tab-badge">{logs.length}</span>}
          </button>
        </div>

        {activeTab === 'files' ? (
          <div className="files-view">
            {sortedFiles.length === 0 ? (
              <div className="sidebar-empty">
                <p>No files ingested yet.</p>
                <span>Drop files into the dropzone to add them here.</span>
              </div>
            ) : (
              <ul id="file-list" className="file-list">
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
        className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <p>Drag and drop any file here</p>
        <p className="dropzone-hint">Any format, any size</p>
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
