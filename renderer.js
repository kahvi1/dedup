// Plain browser JS -- no Node/Electron access here except the one bridged
// function exposed via preload.js (window.electronAPI.getPathForFile).

const dropzone = document.getElementById('dropzone');
const fileListEl = document.getElementById('file-list');

/** @type {{ name: string, path: string, size: number, addedAt: number }[]} */
let files = [];

// --- Drag and drop wiring -----------------------------------------------
// No 'accept' / type filtering anywhere below -> any file format is allowed.
// No size check anywhere below -> any file size is allowed.

['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-over');
  });
});

dropzone.addEventListener('drop', (e) => {
  const dropped = Array.from(e.dataTransfer.files);

  const newEntries = dropped.map((file) => ({
    name: file.name,
    path: window.electronAPI.getPathForFile(file),
    size: file.size,
    addedAt: Date.now(),
  }));

  files = files.concat(newEntries);
  renderFileList();
});

// --- Rendering ------------------------------------------------------------

function renderFileList() {
  // Requirement: sort newest to oldest (most recently dropped first)
  const sorted = [...files].sort((a, b) => b.addedAt - a.addedAt);

  fileListEl.innerHTML = '';

  for (const entry of sorted) {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.title = entry.name; // full name on hover, in case of truncation

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = entry.name; // set full text first so width can be measured

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'file-size';
    sizeSpan.textContent = formatBytes(entry.size);

    li.appendChild(nameSpan);
    li.appendChild(sizeSpan);
    fileListEl.appendChild(li);

    // Truncate AFTER the element is in the DOM, so we can measure its real
    // available width (accounts for current sidebar width, padding, font).
    truncateNameToFit(nameSpan);
  }
}

/**
 * Requirement: if the sidebar isn't wide enough for the full file name,
 * cut characters off the end and replace them with "..." until it fits.
 */
function truncateNameToFit(nameSpan) {
  const fullName = nameSpan.textContent;
  const availableWidth = nameSpan.clientWidth || nameSpan.parentElement.clientWidth - 20;
  const font = getComputedStyle(nameSpan).font;

  if (getTextWidth(fullName, font) <= availableWidth) return; // fits, leave as-is

  let truncated = fullName;
  while (truncated.length > 0 && getTextWidth(truncated + '...', font) > availableWidth) {
    truncated = truncated.slice(0, -1);
  }
  nameSpan.textContent = truncated + '...';
}

function getTextWidth(text, font) {
  getTextWidth._canvas = getTextWidth._canvas || document.createElement('canvas');
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
