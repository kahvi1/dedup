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

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-[#1e3a5f] text-[#93c5fd]';
      case 'success': return 'bg-[#134e3a] text-[#a7f3d0]';
      case 'warning': return 'bg-[#452c0a] text-[#fde68a]';
      case 'error': return 'bg-[#4c1d1d] text-[#fca5a5]';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'info': return 'border-blue-500';
      case 'success': return 'border-emerald-500';
      case 'warning': return 'border-amber-500';
      case 'error': return 'border-red-500';
      default: return 'border-[#555]';
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <div className="flex flex-col gap-2 mb-2.5">
        <div className="flex flex-wrap gap-1">
          {(['all', 'info', 'success', 'warning', 'error'] as const).map((level) => {
            const count =
              level === 'all'
                ? logs.length
                : logs.filter((l) => l.level === level).length;
            return (
              <button
                key={level}
                type="button"
                className={`text-[11px] py-0.5 px-2 rounded border cursor-pointer flex items-center gap-1 transition-all duration-150 ${filter === level ? 'border-blue-500 bg-[#1e3a8a] text-white' : 'border-[#383838] bg-[#242424] text-[#999] hover:bg-[#2e2e2e] hover:text-[#e0e0e0]'}`}
                onClick={() => setFilter(level)}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                {count > 0 && <span className="text-[10px] opacity-80">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-1.5 justify-end">
          <button
            type="button"
            className="text-[11px] py-0.5 px-2 rounded border border-[#3e3e3e] bg-[#262626] text-[#aaa] cursor-pointer transition-all duration-150 hover:not(:disabled):bg-[#333] hover:not(:disabled):text-white disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
            title="Copy logs to clipboard"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className="text-[11px] py-0.5 px-2 rounded border border-[#3e3e3e] bg-[#262626] text-[#aaa] cursor-pointer transition-all duration-150 hover:not(:disabled):bg-[#631c1c] hover:not(:disabled):border-[#8a2424] hover:not(:disabled):text-[#fca5a5] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={clearLogs}
            disabled={logs.length === 0}
            title="Clear all logs"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-[#666] text-[12px] mt-8">
            <p>No activity logs {filter !== 'all' ? `for "${filter}"` : 'yet'}.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`bg-[#252525] rounded-md py-2 px-2.5 text-[12px] border-l-[3px] ${getBorderColor(log.level)}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider py-px px-1 rounded-sm ${getBadgeColor(log.level)}`}>{log.level}</span>
                <span className="text-[11px] text-[#777] tabular-nums">{formatTime(log.timestamp)}</span>
              </div>
              <div className="font-semibold text-[#eee] mb-0.5 break-words">{log.title}</div>
              {log.message && <div className="text-[#aaa] text-[11.5px] break-words leading-relaxed">{log.message}</div>}
              {log.details && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(log.details).map(([key, val]) => (
                    <span key={key} className="bg-[#1c1c1c] border border-[#333] text-[#888] text-[10px] py-0.5 px-1 rounded-sm">
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