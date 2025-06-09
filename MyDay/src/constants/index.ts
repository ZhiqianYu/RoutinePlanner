import { AppSettings, DayTemplate } from '../types';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'auto',
  countDirection: 'down',
  showSeconds: true,
  autoCollapse: false,
  showMajorBlocks: true,
  focusMode: false,
  soundEnabled: true,
  vibrationEnabled: true,
  soundType: 'chime',
  vibrationPattern: 'medium',
  defaultPauseDestination: null,
  autoRedistribute: true,
};

export const STORAGE_KEYS = {
  APP_SETTINGS: 'app_settings',
  DAY_TIME_CONFIG: 'day_time_config',
};

export const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

export const EMOJI_OPTIONS = [
  '⭐', '📚', '💻', '🎯', '🎨', '🏃‍♂️', '🍎', '☕', '🎵', '📱',
  '✍️', '🎮', '📖', '🛠️', '🧘‍♂️', '🎪', '🌟', '🚀', '💡', '🎭'
];

export const ACTIVITY_TYPE_COLORS = {
  start: '#4CAF50',
  pause: '#FF9800',
  pause_end: '#2196F3',
  switch: '#9C27B0',
  complete: '#4CAF50',
  major_block_consume: '#607D8B',
};

export const ACTIVITY_TYPE_ICONS = {
  start: '▶️',
  pause: '⏸️',
  pause_end: '⏭️',
  switch: '🔄',
  complete: '✅',
  major_block_consume: '⏱️',
};

export const DAY_TEMPLATES: DayTemplate[] = [
  {
    name: '工作日模板',
    majorBlocks: [
      { id: 'work', name: '工作', duration: 480, color: '#4CAF50', icon: '💼' },
      { id: 'rest', name: '休息', duration: 480, color: '#FF9800', icon: '😴' },
      { id: 'personal', name: '个人时间', duration: 480, color: '#2196F3', icon: '🎯' },
    ],
    subBlocks: [
      { parentId: 'work', name: '深度工作', duration: 240, color: '#1976D2', icon: '🎯' },
      { parentId: 'work', name: '会议沟通', duration: 120, color: '#7B1FA2', icon: '👥' },
      { parentId: 'work', name: '邮件处理', duration: 60, color: '#D32F2F', icon: '📧' },
      { parentId: 'personal', name: '学习', duration: 120, color: '#388E3C', icon: '📚' },
      { parentId: 'personal', name: '运动', duration: 60, color: '#F57C00', icon: '🏃‍♂️' },
    ],
  },
];

export const VIBRATION_PATTERNS = {
  light: {
    start: [100],
    pause: [50, 50, 50],
    switch: [100, 100, 100],
    complete: [200, 100, 200],
  },
  medium: {
    start: [200],
    pause: [100, 100, 100],
    switch: [150, 150, 150],
    complete: [300, 150, 300],
  },
  strong: {
    start: [400],
    pause: [200, 200, 200],
    switch: [250, 250, 250],
    complete: [500, 250, 500],
  },
};

export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'myday_notifications',
  CHANNEL_NAME: 'MyDay 通知',
  CHANNEL_DESCRIPTION: '时间管理应用通知',
};