import React, { useState, useRef, useEffect } from 'react';

// Canvas text measurement ported from renderer.js
function getTextWidth(text, font) {
    if (!getTextWidth._canvas) {
        getTextWidth._canvas = document.createElement('canvas');
    }
    const ctx = getTextWidth._canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

// A dedicated component ensures each list item handles its own truncation[cite: 7]
function FileItem({ entry }) {
    const nameRef = useRef(null);
    const [displayName, setDisplayName] = useState(entry.name);

    useEffect(() => {
        const nameSpan = nameRef.current;
        if (!nameSpan) return;

        const availableWidth = nameSpan.clientWidth || nameSpan.parentElement.clientWidth - 20;
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
    }, [entry.name]); // Re-run if the file name changes

    return (
        <li className="file-item" title={entry.name}>
            <span ref={nameRef} className="file-name">{displayName}</span>
            <span className="file-size">{formatBytes(entry.size)}</span>
        </li>
    );
}

export default function App() {
    // State management replaces the global 'let files = []' array[cite: 7]
    const [files, setFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const dropped = Array.from(e.dataTransfer.files);

        const newEntries = dropped.map((file) => ({
            name: file.name,
            // Accessing the API exposed by preload.js[cite: 6, 7]
            path: window.electronAPI.getPathForFile(file),
            size: file.size,
            addedAt: Date.now(),
        }));

        // Immutably append new files to the existing state
        setFiles((prev) => [...prev, ...newEntries]);
    };

    // Requirement: sort newest to oldest[cite: 7]
    const sortedFiles = [...files].sort((a, b) => b.addedAt - a.addedAt);

    return (
        <div className="app">
            <aside id="sidebar" className="sidebar">
                <h2 className="sidebar-title">Files</h2>
                <ul id="file-list" className="file-list">
                    {sortedFiles.map((entry, index) => (
                        <FileItem key={index} entry={entry} />
                    ))}
                </ul>
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