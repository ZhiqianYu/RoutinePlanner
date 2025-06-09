// src/types/index.ts

export interface TimeBlock {
  id: string;
  name: string;
  duration: number; // 分钟
  icon?: string;
  color?: string;
  type?: 'work' | 'rest' | 'other';
  children?: TimeBlock[];
  consumedTime?: number;
  isTemporary?: boolean;
}

export interface Session extends TimeBlock {
  remainingTime: number; // 分钟
  totalUsedTime: number; // 分钟
  totalPauseTime: number; // 分钟
  isActive: boolean;
  lastStartTime: number | null; // 时间戳
  pauseStartTime: number | null; // 时间戳
  pauseHistory: Array<{
    duration: number;
    timestamp: Date;
    targetBlock?: string;
  }>;
  currentPauseTarget: TimeBlock | null;
  accumulatedTime: number; // 累积的活跃时间（分钟）
}

export interface TimeDisplay {
  minutes: number;
  seconds: number;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'start' | 'pause' | 'pause_end' | 'switch' | 'complete' | 'major_block_consume';
  description: string;
  remainingTime: number;
  duration: number;
  majorBlocksStatus: Array<{
    id: string;
    name: string;
    remaining: number;
    progressPercent: number;
  }>;
}

export interface AppSettings {
  countDirection: 'up' | 'down';
  showSeconds: boolean;
  vibrationEnabled: boolean;
  vibrationPattern: 'light' | 'medium' | 'strong';
  soundEnabled: boolean;
  soundType: 'chime' | 'bell' | 'beep';
  autoCollapse: boolean;
  showMajorBlocks: boolean;
  autoRedistribute: boolean;
  defaultPauseDestination: string | null;
}

export interface DayTemplate {
  name: string;
  majorBlocks: TimeBlock[];
  subBlocks: Array<{
    parentId: string;
    name: string;
    icon: string;
    color: string;
    duration: number;
  }>;
}