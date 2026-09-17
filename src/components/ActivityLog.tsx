import React, { useState } from 'react';
import { useActivityLog } from '../context/ActivityLogContext';
import { LogLevel } from '../types';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function ActivityLog() {
  const { logs, clearLogs } = useActivityLog();
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const handleCopyLogs = async () => {
    if (filteredLogs.length === 0) return;
    const formatted = filteredLogs
      .map(
        (log) =>
          `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] ${log.title}${
            log.message ? ` - ${log.message}` : ''
          }`
      )
      .join('\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs to clipboard', err);
    }
  };

  return (
    <div className="activity-log-container">
      <div className="activity-log-toolbar">
        <div className="activity-log-filters">
          {(['all', 'info', 'success', 'warning', 'error'] as const).map((level) => {
            const count =
              level === 'all'
                ? logs.length
                : logs.filter((l) => l.level === level).length;
            return (
              <button
                key={level}
                type="button"
                className={`filter-btn ${filter === level ? 'active' : ''} ${level}`}
                onClick={() => setFilter(level)}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                {count > 0 && <span className="filter-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="activity-log-actions">
          <button
            type="button"
            className="action-btn"
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
            title="Copy logs to clipboard"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className="action-btn danger"
            onClick={clearLogs}
            disabled={logs.length === 0}
            title="Clear all logs"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="activity-log-list">
        {filteredLogs.length === 0 ? (
          <div className="activity-log-empty">
            <p>No activity logs {filter !== 'all' ? `for "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`activity-log-item level-${log.level}`}>
              <div className="log-header">
                <span className={`log-badge badge-${log.level}`}>{log.level}</span>
                <span className="log-time">{formatTime(log.timestamp)}</span>
              </div>
              <div className="log-title">{log.title}</div>
              {log.message && <div className="log-message">{log.message}</div>}
              {log.details && (
                <div className="log-details">
                  {Object.entries(log.details).map(([key, val]) => (
                    <span key={key} className="log-detail-tag">
                      {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
