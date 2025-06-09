// src/utils/index.ts
import { TimeDisplay } from '../types';

/**
 * 格式化时间显示（分钟）
 */
export const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

/**
 * 格式化时间显示（包含秒数）
 */
export const formatTimeWithSeconds = (minutes: number, seconds = 0, showSeconds = false): string => {
  if (showSeconds) {
    if (minutes < 60) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  } else {
    return formatTime(minutes);
  }
};

/**
 * 生成唯一ID
 */
export const generateId = (prefix = ''): string => {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 计算进度百分比
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
};

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 检查是否为今天
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * 获取相对时间描述
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return date.toLocaleDateString();
};

/**
 * 验证时间块数据
 */
export const validateTimeBlock = (block: any): boolean => {
  return (
    block &&
    typeof block.id === 'string' &&
    typeof block.name === 'string' &&
    typeof block.duration === 'number' &&
    block.duration > 0 &&
    typeof block.color === 'string'
  );
};

/**
 * 安全的JSON解析
 */
export const safeJsonParse = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

/**
 * 计算两个时间对象的差值
 */
export const getTimeDifference = (start: TimeDisplay, end: TimeDisplay): TimeDisplay => {
  const startTotalSeconds = start.minutes * 60 + start.seconds;
  const endTotalSeconds = end.minutes * 60 + end.seconds;
  const diffSeconds = Math.abs(endTotalSeconds - startTotalSeconds);
  
  return {
    minutes: Math.floor(diffSeconds / 60),
    seconds: diffSeconds % 60
  };
};

/**
 * 时间对象转换为总秒数
 */
export const timeToSeconds = (time: TimeDisplay): number => {
  return time.minutes * 60 + time.seconds;
};

/**
 * 总秒数转换为时间对象
 */
export const secondsToTime = (totalSeconds: number): TimeDisplay => {
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60
  };
};