// src/constants/index.ts
import { DayTemplate, AppSettings } from '../types';

// 存储键名
export const STORAGE_KEYS = {
  APP_SETTINGS: '@DayTimeApp_Settings',
  DAY_TIME_CONFIG: '@DayTimeApp_Config',
  ACTIVITY_LOG: '@DayTimeApp_ActivityLog',
} as const;

// 默认应用设置
export const DEFAULT_APP_SETTINGS: AppSettings = {
  countDirection: 'down',
  showSeconds: true,
  vibrationEnabled: true,
  vibrationPattern: 'medium',
  soundEnabled: true,
  soundType: 'chime',
  autoCollapse: true,
  showMajorBlocks: true,
  autoRedistribute: true,
  defaultPauseDestination: null,
};

// 颜色选项
export const COLOR_OPTIONS = [
  '#7C3AED', '#EF4444', '#10B981', '#F59E0B', '#3B82F6',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899',
  '#6366F1', '#14B8A6', '#A855F7', '#F43F5E', '#22C55E'
];

// 表情选项
export const EMOJI_OPTIONS = [
  '⭐', '📚', '💼', '🎯', '🏃', '🍎', '☕', '💡', '🎵', '🎨',
  '📝', '💻', '📱', '🎮', '🏠', '🚗', '✈️', '🎉', '🎂', '🌟'
];

// 震动模式
export const VIBRATION_PATTERNS = {
  light: {
    start: [0, 100],
    pause: [0, 50],
    complete: [0, 100, 50, 100],
    switch: [0, 50, 50, 50],
  },
  medium: {
    start: [0, 200],
    pause: [0, 100],
    complete: [0, 200, 100, 200],
    switch: [0, 100, 100, 100],
  },
  strong: {
    start: [0, 400],
    pause: [0, 200],
    complete: [0, 400, 200, 400],
    switch: [0, 200, 200, 200],
  },
} as const;

// 声音类型
export const SOUND_TYPES = {
  chime: {
    name: '铃声',
    start: 'chime_start',
    pause: 'chime_pause', 
    complete: 'chime_complete',
  },
  bell: {
    name: '钟声',
    start: 'bell_start',
    pause: 'bell_pause',
    complete: 'bell_complete',
  },
  beep: {
    name: '提示音',
    start: 'beep_start',
    pause: 'beep_pause',
    complete: 'beep_complete',
  },
} as const;

// 声音分类
export const SOUND_CATEGORIES = {
  start: '开始提醒',
  pause: '暂停提醒', 
  complete: '完成提醒',
} as const;

// 震动分类
export const VIBRATION_CATEGORIES = {
  start: '开始震动',
  pause: '暂停震动',
  complete: '完成震动',
  switch: '切换震动',
} as const;

// 通知配置
export const NOTIFICATION_CONFIG = {
  CHANNEL_ID: 'day_time_manager',
  CHANNEL_NAME: '身体感知时间管理',
  CHANNEL_DESCRIPTION: '时间块提醒和通知',
} as const;

// 活动类型颜色
export const ACTIVITY_TYPE_COLORS = {
  start: '#4CAF50',
  pause: '#FF9800',
  pause_end: '#2196F3',
  switch: '#9C27B0',
  complete: '#4CAF50',
  major_block_consume: '#607D8B',
} as const;

// 活动类型图标
export const ACTIVITY_TYPE_ICONS = {
  start: '▶️',
  pause: '⏸️',
  pause_end: '▶️',
  switch: '🔄',
  complete: '✅',
  major_block_consume: '⏳',
} as const;

// 24小时模板
export const DAY_TEMPLATES: DayTemplate[] = [
  {
    name: '标准工作日',
    majorBlocks: [
      {
        id: 'work_time',
        name: '清醒工作时间',
        duration: 960, // 16小时
        icon: '☀️',
        color: '#4CAF50',
        type: 'work',
        consumedTime: 0,
      },
      {
        id: 'sleep_time',
        name: '休息睡眠时间',
        duration: 480, // 8小时
        icon: '🌙',
        color: '#9C27B0',
        type: 'rest',
        consumedTime: 0,
      }
    ],
    subBlocks: [
      // 工作时间块
      { parentId: 'work_time', name: '深度工作', icon: '💻', color: '#2196F3', duration: 240 },
      { parentId: 'work_time', name: '学习阅读', icon: '📚', color: '#FF9800', duration: 120 },
      { parentId: 'work_time', name: '沟通交流', icon: '💬', color: '#4CAF50', duration: 90 },
      { parentId: 'work_time', name: '日常事务', icon: '📋', color: '#607D8B', duration: 90 },
      { parentId: 'work_time', name: '创意思考', icon: '💡', color: '#9C27B0', duration: 60 },
      // 休息时间块
      { parentId: 'sleep_time', name: '晚间放松', icon: '🧘', color: '#795548', duration: 60 },
      { parentId: 'sleep_time', name: '深度睡眠', icon: '😴', color: '#3F51B5', duration: 420 },
    ]
  },
  {
    name: '学习专注日',
    majorBlocks: [
      {
        id: 'active_time',
        name: '活跃学习时间',
        duration: 900, // 15小时
        icon: '🧠',
        color: '#FF5722',
        type: 'work',
        consumedTime: 0,
      },
      {
        id: 'rest_time',
        name: '休息恢复时间',
        duration: 540, // 9小时
        icon: '🛌',
        color: '#00BCD4',
        type: 'rest',
        consumedTime: 0,
      }
    ],
    subBlocks: [
      // 学习时间块
      { parentId: 'active_time', name: '核心学习', icon: '🎯', color: '#E91E63', duration: 300 },
      { parentId: 'active_time', name: '练习巩固', icon: '✍️', color: '#673AB7', duration: 180 },
      { parentId: 'active_time', name: '项目实践', icon: '🔧', color: '#009688', duration: 150 },
      { parentId: 'active_time', name: '复习总结', icon: '📖', color: '#795548', duration: 120 },
      { parentId: 'active_time', name: '知识探索', icon: '🔍', color: '#FF9800', duration: 90 },
      // 休息时间块
      { parentId: 'rest_time', name: '短暂休息', icon: '☕', color: '#8BC34A', duration: 60 },
      { parentId: 'rest_time', name: '夜间睡眠', icon: '🌜', color: '#3F51B5', duration: 480 },
    ]
  },
  {
    name: '平衡生活日',
    majorBlocks: [
      {
        id: 'productive_time',
        name: '高效产出时间',
        duration: 720, // 12小时
        icon: '⚡',
        color: '#FFC107',
        type: 'work',
        consumedTime: 0,
      },
      {
        id: 'personal_time',
        name: '个人生活时间',
        duration: 720, // 12小时
        icon: '🏡',
        color: '#E91E63',
        type: 'rest',
        consumedTime: 0,
      }
    ],
    subBlocks: [
      // 产出时间块
      { parentId: 'productive_time', name: '重要工作', icon: '🎯', color: '#F44336', duration: 180 },
      { parentId: 'productive_time', name: '技能提升', icon: '📈', color: '#2196F3', duration: 120 },
      { parentId: 'productive_time', name: '创作输出', icon: '🎨', color: '#9C27B0', duration: 90 },
      { parentId: 'productive_time', name: '规划思考', icon: '🤔', color: '#607D8B', duration: 60 },
      // 个人时间块
      { parentId: 'personal_time', name: '运动健身', icon: '🏃', color: '#4CAF50', duration: 90 },
      { parentId: 'personal_time', name: '社交娱乐', icon: '🎉', color: '#FF9800', duration: 120 },
      { parentId: 'personal_time', name: '兴趣爱好', icon: '🎵', color: '#00BCD4', duration: 90 },
      { parentId: 'personal_time', name: '休息睡眠', icon: '💤', color: '#673AB7', duration: 420 },
    ]
  }
];