// 导出所有类型定义
export interface TimeBlock {
  id: string;
  name: string;
  icon?: string;
  color: string;
  duration: number;
  consumedTime?: number;
  children?: TimeBlock[];
  isTemporary?: boolean;
  type?: string;
}

export interface Session extends TimeBlock {
  remainingTime: number;
  totalUsedTime: number;
  totalPauseTime: number;
  isActive: boolean;
  lastStartTime: number | null;
  pauseStartTime: number | null;
  pauseHistory: Array<{
    duration: number;
    timestamp: Date;
    targetBlock?: string;
  }>;
  currentPauseTarget: TimeBlock | null;
  accumulatedTime: number;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'start' | 'pause' | 'pause_end' | 'switch' | 'complete' | 'major_block_consume';
  description: string;
  remainingTime: number;
  duration: number;
  majorBlocksStatus?: Array<{
    id: string;
    name: string;
    remaining: number;
    progressPercent: number;
  }>;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  countDirection: 'up' | 'down';
  showSeconds: boolean;
  autoCollapse: boolean;
  showMajorBlocks: boolean;
  focusMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  soundType: string;
  vibrationPattern: 'light' | 'medium' | 'strong';
  defaultPauseDestination: string | null;
  autoRedistribute: boolean;
}

export interface DayTemplate {
  name: string;
  majorBlocks: TimeBlock[];
  subBlocks: Array<Omit<TimeBlock, 'id'> & { parentId: string }>;
}

export interface TimeDisplay {
  minutes: number;
  seconds: number;
}