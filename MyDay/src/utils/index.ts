export const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  }
  return `${m}m`;
};

export const formatTimeWithSeconds = (minutes: number, seconds: number, showSeconds: boolean): string => {
  if (showSeconds) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:00`;
};

export const calculateProgress = (current: number, total: number): number => {
  return total > 0 ? (current / total) * 100 : 0;
};

export const generateId = (prefix: string = ''): string => {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

export const safeJsonParse = (str: string, fallback: any): any => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};