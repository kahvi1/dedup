export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  level: LogLevel;
  title: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface FileEntry {
  name: string;
  path: string;
  size: number;
  addedAt: number;
}
