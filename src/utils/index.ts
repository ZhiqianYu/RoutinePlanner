// src/utils/index.ts
import { TimeBlock } from '../types';

/**
 * 格式化时间显示（分钟）
 */
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  }
  return `${mins}分钟`;
};

/**
 * 格式化时间显示（分钟和秒）
 */
export const formatTimeWithSeconds = (minutes: number, seconds: number, showSeconds: boolean = true): string => {
  if (showSeconds) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:00`;
};

/**
 * 计算进度百分比
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min((current / total) * 100, 100);
};

/**
 * 生成唯一ID
 */
export const generateId = (prefix: string = 'id_'): string => {
  return prefix + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * 安全的JSON解析
 */
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON解析失败:', error);
    return defaultValue;
  }
};

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 检查日期是否为今天
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
};

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
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
 * 验证数据类型
 */
export const validateTimeBlock = (block: any): block is TimeBlock => {
  return (
    typeof block === 'object' &&
    block !== null &&
    typeof block.id === 'string' &&
    typeof block.name === 'string' &&
    typeof block.duration === 'number' &&
    block.duration > 0
  );
};