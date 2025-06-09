import { AppSettings, DayTemplate } from '../types';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark', // 默认深色
  countDirection: 'down',
  showSeconds: true,
  autoCollapse: false,
  showMajorBlocks: true,
  focusMode: false, // 保留但通过悬浮按钮控制
  soundEnabled: true,
  vibrationEnabled: true,
  soundType: 'chime',
  vibrationPattern: 'medium',
  defaultPauseDestination: null,
  autoRedistribute: true,
  // 新增细分设置
  startSoundType: 'chime',
  pauseSoundType: 'soft',
  completeSoundType: 'success',
  startVibrationPattern: 'light',
  pauseVibrationPattern: 'medium',
  completeVibrationPattern: 'strong',
};

export const STORAGE_KEYS = {
  APP_SETTINGS: 'app_settings',
  DAY_TIME_CONFIG: 'day_time_config',
};

// 深色主题配色
export const DARK_THEME = {
  background: '#1a1a1a',
  cardBackground: '#2d2d2d',
  headerBackground: '#2d2d2d',
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  border: '#444444',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',
  accent: '#7C3AED',
};

// 浅色主题配色
export const LIGHT_THEME = {
  background: '#f5f5f5',
  cardBackground: '#ffffff',
  headerBackground: '#ffffff',
  textPrimary: '#212121',
  textSecondary: '#757575',
  textMuted: '#9e9e9e',
  border: '#e0e0e0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#f44336',
  info: '#2196F3',
  accent: '#7C3AED',
};

export const COLOR_OPTIONS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
];

export const EMOJI_OPTIONS = [
  '⭐', '📚', '💻', '🎯', '🎨', '🏃‍♂️', '🍎', '☕', '🎵', '📱',
  '✍️', '🎮', '📖', '🛠️', '🧘‍♂️', '🎪', '🌟', '🚀', '💡', '🎭',
  '🍽️', '🧹', '💤', '⚡', '🎬', '🎧', '📝', '🔬', '🎪', '🌱'
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

// 优化后的默认模板 - 工作4h×2 + 睡觉7h + 休息1h + 个人时间细分
export const DEFAULT_DAY_TEMPLATE: DayTemplate = {
  name: '标准24小时配置',
  majorBlocks: [
    { id: 'work', name: '工作时间', duration: 480, color: '#4CAF50', icon: '💼', type: 'work' }, // 8小时
    { id: 'sleep', name: '睡觉时间', duration: 420, color: '#9C27B0', icon: '💤', type: 'rest' }, // 7小时
    { id: 'break', name: '休息时间', duration: 60, color: '#FF9800', icon: '☕', type: 'rest' }, // 1小时
    { id: 'personal', name: '个人时间', duration: 480, color: '#2196F3', icon: '🎯', type: 'personal' }, // 8小时
  ],
  subBlocks: [
    // 工作时间细分为两个4小时段
    { parentId: 'work', name: '上午工作', duration: 240, color: '#1976D2', icon: '🌅' },
    { parentId: 'work', name: '下午工作', duration: 240, color: '#1565C0', icon: '🌆' },

    // 睡觉时间细分
    { parentId: 'sleep', name: '夜间睡眠', duration: 420, color: '#673AB7', icon: '🌙' }, // 7小时
    // 休息时间细分
    { parentId: 'break', name: '短暂休息', duration: 60, color: '#FF5722', icon: '🛋️' }, // 1小时    
    // 个人时间细分
    { parentId: 'personal', name: '收拾整理', duration: 60, color: '#388E3C', icon: '🧹' },
    { parentId: 'personal', name: '吃饭时间', duration: 180, color: '#F57C00', icon: '🍽️' }, // 3小时 (早中晚)
    { parentId: 'personal', name: '放松娱乐', duration: 180, color: '#7B1FA2', icon: '🎮' }, // 3小时
    { parentId: 'personal', name: '运动健身', duration: 60, color: '#D32F2F', icon: '🏃‍♂️' }, // 1小时
  ],
};

// 保留多个模板供高级用户选择
export const DAY_TEMPLATES: DayTemplate[] = [
  DEFAULT_DAY_TEMPLATE,
  {
    name: '学生模式',
    majorBlocks: [
      { id: 'study', name: '学习时间', duration: 600, color: '#4CAF50', icon: '📚', type: 'work' }, // 10小时
      { id: 'sleep', name: '睡觉时间', duration: 480, color: '#9C27B0', icon: '💤', type: 'rest' }, // 8小时
      { id: 'personal', name: '个人时间', duration: 360, color: '#2196F3', icon: '🎯', type: 'personal' }, // 6小时
    ],
    subBlocks: [
      { parentId: 'study', name: '专业课学习', duration: 300, color: '#1976D2', icon: '📖' },
      { parentId: 'study', name: '作业练习', duration: 180, color: '#1565C0', icon: '✍️' },
      { parentId: 'study', name: '复习巩固', duration: 120, color: '#0D47A1', icon: '🔄' },
      { parentId: 'personal', name: '吃饭', duration: 120, color: '#F57C00', icon: '🍽️' },
      { parentId: 'personal', name: '运动', duration: 60, color: '#D32F2F', icon: '🏃‍♂️' },
      { parentId: 'personal', name: '娱乐', duration: 180, color: '#7B1FA2', icon: '🎮' },
    ],
  },
  {
    name: '自由工作者',
    majorBlocks: [
      { id: 'work', name: '工作项目', duration: 540, color: '#4CAF50', icon: '💻', type: 'work' }, // 9小时
      { id: 'sleep', name: '睡觉', duration: 450, color: '#9C27B0', icon: '💤', type: 'rest' }, // 7.5小时
      { id: 'personal', name: '生活时间', duration: 450, color: '#2196F3', icon: '🎯', type: 'personal' }, // 7.5小时
    ],
    subBlocks: [
      { parentId: 'work', name: '核心工作', duration: 360, color: '#1976D2', icon: '🎯' },
      { parentId: 'work', name: '沟通协调', duration: 120, color: '#1565C0', icon: '👥' },
      { parentId: 'work', name: '技能学习', duration: 60, color: '#0D47A1', icon: '📚' },
      { parentId: 'personal', name: '家务料理', duration: 90, color: '#388E3C', icon: '🧹' },
      { parentId: 'personal', name: '用餐时间', duration: 150, color: '#F57C00', icon: '🍽️' },
      { parentId: 'personal', name: '休闲娱乐', duration: 150, color: '#7B1FA2', icon: '🎬' },
      { parentId: 'personal', name: '运动健身', duration: 60, color: '#D32F2F', icon: '🏃‍♂️' },
    ],
  },
];

// 声音类型选项
export const SOUND_OPTIONS = {
  chime: { name: '清脆铃声', file: 'chime.mp3' },
  soft: { name: '柔和提示', file: 'soft.mp3' },
  success: { name: '成功音效', file: 'success.mp3' },
  bell: { name: '钟声', file: 'bell.mp3' },
  pop: { name: '轻快音效', file: 'pop.mp3' },
  none: { name: '无声音', file: null },
};

// 震动模式细分
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
  custom: {
    start: [150, 50, 150],
    pause: [100, 50, 100, 50, 100],
    switch: [200, 100, 200, 100, 200],
    complete: [400, 200, 400, 200, 400],
  },
};

export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'myday_notifications',
  CHANNEL_NAME: 'MyDay 通知',
  CHANNEL_DESCRIPTION: '时间管理应用通知',
};

// 专注模式配置
export const FOCUS_MODE_CONFIG = {
  backgroundColor: 'rgba(0,0,0,0.95)',
  textColor: '#ffffff',
  fontSize: {
    time: 48,
    name: 24,
    status: 16,
  },
  padding: 40,
  borderRadius: 16,
};