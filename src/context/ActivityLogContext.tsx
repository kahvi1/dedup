import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ActivityLogItem, LogLevel } from '../types';

interface ActivityLogContextType {
  logs: ActivityLogItem[];
  addLog: (entry: {
    level: LogLevel;
    title: string;
    message?: string;
    details?: Record<string, unknown>;
  }) => void;
  logInfo: (title: string, message?: string, details?: Record<string, unknown>) => void;
  logSuccess: (title: string, message?: string, details?: Record<string, unknown>) => void;
  logWarning: (title: string, message?: string, details?: Record<string, unknown>) => void;
  logError: (title: string, message?: string, details?: Record<string, unknown>) => void;
  clearLogs: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<ActivityLogItem[]>(() => [
    {
      id: generateId(),
      timestamp: Date.now(),
      level: 'info',
      title: 'Application ready',
      message: 'Drop files into the workspace to begin.',
    },
  ]);

  const addLog = useCallback(
    ({
      level,
      title,
      message,
      details,
    }: {
      level: LogLevel;
      title: string;
      message?: string;
      details?: Record<string, unknown>;
    }) => {
      const newEntry: ActivityLogItem = {
        id: generateId(),
        timestamp: Date.now(),
        level,
        title,
        message,
        details,
      };
      setLogs((prev) => [newEntry, ...prev]);
    },
    []
  );

  const logInfo = useCallback(
    (title: string, message?: string, details?: Record<string, unknown>) => {
      addLog({ level: 'info', title, message, details });
    },
    [addLog]
  );

  const logSuccess = useCallback(
    (title: string, message?: string, details?: Record<string, unknown>) => {
      addLog({ level: 'success', title, message, details });
    },
    [addLog]
  );

  const logWarning = useCallback(
    (title: string, message?: string, details?: Record<string, unknown>) => {
      addLog({ level: 'warning', title, message, details });
    },
    [addLog]
  );

  const logError = useCallback(
    (title: string, message?: string, details?: Record<string, unknown>) => {
      addLog({ level: 'error', title, message, details });
    },
    [addLog]
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <ActivityLogContext.Provider
      value={{
        logs,
        addLog,
        logInfo,
        logSuccess,
        logWarning,
        logError,
        clearLogs,
      }}
    >
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog(): ActivityLogContextType {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
}
