// src/constants/index.ts
import { DayTemplate, AppSettings } from '../types';

// 默认应用设置
export const DEFAULT_APP_SETTINGS: AppSettings = {
  countDirection: 'down',
  showSeconds: true,
  updateInterval: 1,
  autoCollapse: true,
  showMajorBlocks: false,
  focusMode: true,
  soundEnabled: true,
  vibrationEnabled: true,
  autoRedistribute: true,
  theme: 'auto',
  defaultPauseDestination: null,
  vibrationPattern: 'medium',
  soundType: 'chime',
};

// 24小时模板（更清爽的颜色）
export const DAY_TEMPLATES: DayTemplate[] = [
  {
    name: '工作日模板',
    majorBlocks: [
      { id: 'awake', name: '清醒工作时间', duration: 16 * 60, type: 'active', color: '#00D4FF' },
      { id: 'rest', name: '休息睡眠时间', duration: 8 * 60, type: 'rest', color: '#00FF88' },
    ],
    subBlocks: [
      { parentId: 'awake', name: '专注学习1', duration: 240, icon: '📚', color: '#FF6B9D', id: 'study1' },
      { parentId: 'awake', name: '早餐时间', duration: 30, icon: '🥞', color: '#FFE066', id: 'breakfast' },
      { parentId: 'awake', name: '专注学习2', duration: 240, icon: '📚', color: '#FF6B9D', id: 'study2' },
      { parentId: 'awake', name: '午餐时间', duration: 45, icon: '🍽️', color: '#FFE066', id: 'lunch' },
      { parentId: 'awake', name: '运动时间', duration: 60, icon: '🏃‍♂️', color: '#00FFAA', id: 'exercise' },
      { parentId: 'awake', name: '项目开发', duration: 180, icon: '💻', color: '#C77DFF', id: 'coding' },
      { parentId: 'awake', name: '晚餐时间', duration: 45, icon: '🍽️', color: '#FFE066', id: 'dinner' },
      { parentId: 'awake', name: '自由时间', duration: 120, icon: '🎮', color: '#00E4FF', id: 'free' },
      { parentId: 'rest', name: '夜间睡眠', duration: 420, icon: '🌙', color: '#7C3AED', id: 'sleep' },
      { parentId: 'rest', name: '放松休息', duration: 60, icon: '🧘‍♂️', color: '#00E4FF', id: 'relax' },
    ]
  },
  {
    name: '学习日模板',
    majorBlocks: [
      { id: 'study', name: '学习专注时间', duration: 14 * 60, type: 'active', color: '#7C3AED' },
      { id: 'life', name: '生活休息时间', duration: 10 * 60, type: 'rest', color: '#F59E0B' },
    ],
    subBlocks: [
      { parentId: 'study', name: '数学学习', duration: 180, icon: '🔢', color: '#FF6B9D', id: 'math' },
      { parentId: 'study', name: '编程练习', duration: 240, icon: '💻', color: '#00D4FF', id: 'programming' },
      { parentId: 'study', name: '英语学习', duration: 120, icon: '🔤', color: '#00FF88', id: 'english' },
      { parentId: 'study', name: '项目实践', duration: 300, icon: '🛠️', color: '#FF8C42', id: 'project' },
      { parentId: 'life', name: '睡眠时间', duration: 480, icon: '🌙', color: '#7C3AED', id: 'sleep2' },
      { parentId: 'life', name: '用餐休息', duration: 120, icon: '🍽️', color: '#FFE066', id: 'meals' },
    ]
  }
];

// 颜色选项（更清爽的颜色）
export const COLOR_OPTIONS = [
  '#7C3AED', '#FF6B9D', '#FFE066', '#00FFAA', '#00E4FF',
  '#C77DFF', '#00D4FF', '#00FF88', '#FF8C42', '#F59E0B'
];

// 图标选项
export const EMOJI_OPTIONS = [
  '📚', '💼', '🍽️', '🏃‍♂️', '🧘‍♂️', '🎮', '🌙', '🚗',
  '☀️', '⭐', '🎯', '💡', '🎨', '🎵', '📱', '💻'
];

// 震动模式配置
export const VIBRATION_PATTERNS = {
  light: {
    start: [50, 25, 50],
    pause: [100, 50, 100],
    complete: [500, 250, 500],
    switch: [50, 25, 50, 25, 50],
  },
  medium: {
    start: [100, 50, 100],
    pause: [200, 100, 200],
    complete: [1000, 500, 1000, 500, 1000],
    switch: [100, 50, 100, 50, 100],
  },
  strong: {
    start: [200, 100, 200],
    pause: [400, 200, 400],
    complete: [1500, 750, 1500, 750, 1500],
    switch: [200, 100, 200, 100, 200],
  }
};

// 活动日志类型颜色和图标
export const ACTIVITY_TYPE_COLORS = {
  start: '#4CAF50',
  pause: '#FF9800',
  switch: '#2196F3',
  complete: '#9C27B0',
  pause_end: '#00BCD4',
  major_block_consume: '#FF5722',
};

export const ACTIVITY_TYPE_ICONS = {
  start: '▶️',
  pause: '⏸️',
  switch: '🔄',
  complete: '✅',
  pause_end: '💤',
  major_block_consume: '📊',
};

// 存储键名
export const STORAGE_KEYS = {
  APP_SETTINGS: 'appSettings',
  DAY_TIME_CONFIG: 'dayTimeConfig',
};

// 通知配置
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'time-blocks',
  CHANNEL_NAME: '时间块提醒',
  CHANNEL_DESCRIPTION: '时间块开始和结束提醒',
};