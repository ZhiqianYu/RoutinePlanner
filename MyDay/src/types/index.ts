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
  vibrationPattern: 'light' | 'medium' | 'strong' | 'custom';
  defaultPauseDestination: string | null;
  autoRedistribute: boolean;
  
  // 新增细分设置
  startSoundType: string;
  pauseSoundType: string;
  completeSoundType: string;
  startVibrationPattern: 'light' | 'medium' | 'strong' | 'custom';
  pauseVibrationPattern: 'light' | 'medium' | 'strong' | 'custom';
  completeVibrationPattern: 'light' | 'medium' | 'strong' | 'custom';
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

// 新增主题类型
export interface Theme {
  background: string;
  cardBackground: string;
  headerBackground: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  accent: string;
}

// 新增专注模式状态
export interface FocusModeState {
  isActive: boolean;
  isLandscape: boolean;
  triggeredBy: 'button' | 'orientation' | 'manual';
}