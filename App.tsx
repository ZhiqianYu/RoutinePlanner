import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  FlatList,
  Switch,
  AppState,
  Platform,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import BackgroundTimer from 'react-native-background-timer';

const { width, height } = Dimensions.get('window');

// ============================================================================
// 🎯 TypeScript 类型定义
// ============================================================================

interface TimeBlock {
  id: string;
  name: string;
  duration: number;
  icon?: string;
  color: string;
  children?: TimeBlock[];
  consumedTime?: number;
  type?: 'active' | 'rest';
  isTemporary?: boolean;
}

interface Session {
  id: string;
  name: string;
  duration: number;
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
  icon?: string;
  color: string;
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'start' | 'pause' | 'switch' | 'complete' | 'pause_end' | 'major_block_consume';
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

interface AppSettings {
  countDirection: 'up' | 'down';
  showSeconds: boolean;
  updateInterval: number;
  autoCollapse: boolean;
  showMajorBlocks: boolean;
  focusMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoRedistribute: boolean;
  theme: 'light' | 'dark' | 'auto';
  defaultPauseDestination: string | null;
  vibrationPattern: 'light' | 'medium' | 'strong';
  soundType: 'beep' | 'chime' | 'notification';
}

interface DayTemplate {
  name: string;
  majorBlocks: TimeBlock[];
  subBlocks: Array<TimeBlock & { parentId: string }>;
}

interface VibrationPatterns {
  start: number[];
  pause: number[];
  complete: number[];
  switch: number[];
}

// ============================================================================
// 🧠 增强的时间管理类（修复版）
// ============================================================================

class DayTimeManager {
  private sessions = new Map<string, Session>();
  private activityLog: ActivityLog[] = [];
  private majorBlocks: TimeBlock[] = [];
  private pauseDestinationBlock: TimeBlock | null = null;
  private collapseStates = new Map<string, boolean>();

  setMajorBlocks(blocks: TimeBlock[]): void {
    this.majorBlocks = blocks.map(block => ({
      ...block,
      consumedTime: block.consumedTime || 0,
    }));
    
    this.pauseDestinationBlock = this.majorBlocks.find(block => 
      block.type === 'rest' || 
      block.name.includes('休息') || 
      block.name.includes('睡眠')
    ) || this.majorBlocks[1] || null;
  }

  initializeSession(block: TimeBlock): Session {
    if (!this.sessions.has(block.id)) {
      this.sessions.set(block.id, {
        ...block,
        remainingTime: block.duration,
        totalUsedTime: 0,
        totalPauseTime: 0,
        isActive: false,
        lastStartTime: null,
        pauseStartTime: null,
        pauseHistory: [],
        currentPauseTarget: null,
        accumulatedTime: 0,
      });
    }
    return this.sessions.get(block.id)!;
  }

  startSession(blockId: string): Session | null {
    const session = this.sessions.get(blockId);
    if (session) {
      session.isActive = true;
      session.lastStartTime = Date.now();
      
      if (session.pauseStartTime) {
        this.endPauseTime(blockId);
      }
      
      this.logActivity('start', session.name, session.remainingTime);
      return session;
    }
    return null;
  }

  // 修复：使用秒为单位提高精度
  pauseSession(blockId: string, destinationBlockId?: string): { session: Session; activeTime: number; targetBlock: TimeBlock | null } | null {
    const session = this.sessions.get(blockId);
    if (!session || !session.isActive || !session.lastStartTime) return null;

    const pauseStartTime = Date.now();
    const activeTimeMs = pauseStartTime - session.lastStartTime;
    const activeTimeSeconds = Math.floor(activeTimeMs / 1000);
    const activeTimeMinutes = Math.floor(activeTimeSeconds / 60);
    
    // 更新累计时间（保持分钟精度用于显示）
    session.accumulatedTime += activeTimeMinutes;
    session.remainingTime = Math.max(0, session.remainingTime - activeTimeMinutes);
    session.totalUsedTime += activeTimeMinutes;
    session.isActive = false;
    session.pauseStartTime = pauseStartTime;
    
    const targetBlock = destinationBlockId ? 
      this.majorBlocks.find(b => b.id === destinationBlockId) : 
      this.pauseDestinationBlock;
    
    session.currentPauseTarget = targetBlock;
    
    this.logActivity('pause', 
      `暂停 ${session.name}，时间将计入 ${targetBlock?.name || '未知'}`, 
      session.remainingTime, 
      activeTimeMinutes
    );
    
    return { session, activeTime: activeTimeMinutes, targetBlock };
  }

  endPauseTime(blockId: string): number {
    const session = this.sessions.get(blockId);
    if (!session || !session.pauseStartTime) return 0;

    const pauseDurationMs = Date.now() - session.pauseStartTime;
    const pauseDurationMinutes = Math.floor(pauseDurationMs / (60 * 1000));
    const targetBlock = session.currentPauseTarget;
    
    session.totalPauseTime += pauseDurationMinutes;
    session.pauseStartTime = null;
    session.currentPauseTarget = null;
    
    if (targetBlock) {
      this.consumeMajorBlockTime(targetBlock.id, pauseDurationMinutes);
    }
    
    session.pauseHistory.push({
      duration: pauseDurationMinutes,
      timestamp: new Date(),
      targetBlock: targetBlock?.name,
    });
    
    this.logActivity('pause_end', 
      `结束暂停，暂停了 ${pauseDurationMinutes} 分钟，计入 ${targetBlock?.name || '未知'}`,
      0, 
      pauseDurationMinutes
    );
    
    return pauseDurationMinutes;
  }

  consumeMajorBlockTime(blockId: string, minutes: number): void {
    const majorBlock = this.majorBlocks.find(block => block.id === blockId);
    if (majorBlock) {
      majorBlock.consumedTime = (majorBlock.consumedTime || 0) + minutes;
      
      this.logActivity('major_block_consume', 
        `${majorBlock.name} 消耗了 ${minutes} 分钟`,
        majorBlock.duration - majorBlock.consumedTime,
        minutes
      );
    }
  }

  switchToSession(fromBlockId: string | null, toBlockId: string, pauseDestination?: string): { 
    pauseResult: { session: Session; activeTime: number; targetBlock: TimeBlock | null } | null;
    newSession: Session | null;
  } {
    let pauseResult = null;
    
    if (fromBlockId) {
      pauseResult = this.pauseSession(fromBlockId, pauseDestination);
    }
    
    const newSession = this.startSession(toBlockId);
    
    this.logActivity('switch', 
      `从 ${this.sessions.get(fromBlockId || '')?.name || '无'} 切换到 ${newSession?.name || '未知'}`,
      newSession?.remainingTime || 0
    );
    
    return { pauseResult, newSession };
  }

  // 修复：提高时间计算精度，支持秒级显示
  getCurrentPauseTime(blockId: string): { minutes: number; seconds: number } {
    const session = this.sessions.get(blockId);
    if (session && session.pauseStartTime) {
      const pauseMs = Date.now() - session.pauseStartTime;
      const totalSeconds = Math.floor(pauseMs / 1000);
      return {
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60
      };
    }
    return { minutes: 0, seconds: 0 };
  }

  getCurrentElapsedTime(blockId: string): { minutes: number; seconds: number } {
    const session = this.sessions.get(blockId);
    if (session && session.isActive && session.lastStartTime) {
      const currentElapsedMs = Date.now() - session.lastStartTime;
      const currentElapsedSeconds = Math.floor(currentElapsedMs / 1000);
      const totalSeconds = session.accumulatedTime * 60 + currentElapsedSeconds;
      return {
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60
      };
    }
    return {
      minutes: session ? session.accumulatedTime : 0,
      seconds: 0
    };
  }

  getCurrentRemainingTime(blockId: string): { minutes: number; seconds: number } {
    const session = this.sessions.get(blockId);
    if (session && session.isActive && session.lastStartTime) {
      const currentElapsedMs = Date.now() - session.lastStartTime;
      const currentElapsedMinutes = Math.floor(currentElapsedMs / (60 * 1000));
      const currentElapsedSeconds = Math.floor((currentElapsedMs % (60 * 1000)) / 1000);
      const remainingTotalSeconds = Math.max(0, session.remainingTime * 60 - (currentElapsedMinutes * 60 + currentElapsedSeconds));
      return {
        minutes: Math.floor(remainingTotalSeconds / 60),
        seconds: remainingTotalSeconds % 60
      };
    }
    return {
      minutes: session ? session.remainingTime : 0,
      seconds: 0
    };
  }

  getMajorBlocksStatus(): Array<{ id: string; name: string; remaining: number; progressPercent: number }> {
    return this.majorBlocks.map(block => ({
      id: block.id,
      name: block.name,
      remaining: block.duration - (block.consumedTime || 0),
      progressPercent: ((block.consumedTime || 0) / block.duration) * 100
    }));
  }

  logActivity(type: ActivityLog['type'], description: string, remainingTime = 0, duration = 0): void {
    const activity: ActivityLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type,
      description,
      remainingTime,
      duration,
      majorBlocksStatus: this.getMajorBlocksStatus(),
    };
    
    this.activityLog.push(activity);
    
    // 保留24小时内的记录
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.activityLog = this.activityLog.filter(log => log.timestamp.getTime() > oneDayAgo);
  }

  resetSession(blockId: string): void {
    const session = this.sessions.get(blockId);
    if (session) {
      const originalDuration = session.duration;
      Object.assign(session, {
        remainingTime: originalDuration,
        totalUsedTime: 0,
        totalPauseTime: 0,
        isActive: false,
        lastStartTime: null,
        pauseStartTime: null,
        pauseHistory: [],
        currentPauseTarget: null,
        accumulatedTime: 0,
      });
    }
  }

  getActivityLog(): ActivityLog[] {
    return [...this.activityLog].reverse();
  }

  getDailyStats() {
    const today = new Date().toDateString();
    const todayLogs = this.activityLog.filter(log => 
      log.timestamp.toDateString() === today
    );

    const completedTasks = todayLogs.filter(log => log.type === 'complete').length;
    const switchCount = todayLogs.filter(log => log.type === 'switch').length;
    const pauseCount = todayLogs.filter(log => log.type === 'pause').length;
    
    const totalActiveTime = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.totalUsedTime, 0);
    const totalPauseTime = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.totalPauseTime, 0);

    return {
      totalActiveTime,
      totalPauseTime,
      completedTasks,
      switchCount,
      pauseCount,
      majorBlocksStatus: this.getMajorBlocksStatus(),
      totalActivities: todayLogs.length,
    };
  }

  setCollapseState(parentId: string, isCollapsed: boolean): void {
    this.collapseStates.set(parentId, isCollapsed);
  }

  getCollapseState(parentId: string): boolean {
    return this.collapseStates.get(parentId) || false;
  }
}

// ============================================================================
// 🔔 增强的通知管理器（修复版）
// ============================================================================

class NotificationManager {
  private vibrationPatterns: Record<string, Record<string, number[]>> = {
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

  constructor() {
    this.configure();
  }

  private configure(): void {
    PushNotification.configure({
      onRegister: (token) => console.log('通知令牌:', token),
      onNotification: (notification) => console.log('收到通知:', notification),
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    PushNotification.createChannel({
      channelId: "time-blocks",
      channelName: "时间块提醒",
      channelDescription: "时间块开始和结束提醒",
      playSound: true,
      soundName: "default",
      importance: 4,
      vibrate: true,
    });
  }

  vibrate(type: string = 'start', pattern: string = 'medium'): void {
    const vibrationPattern = this.vibrationPatterns[pattern]?.[type] || this.vibrationPatterns.medium[type];
    if (Platform.OS === 'android') {
      Vibration.vibrate(vibrationPattern);
    } else {
      Vibration.vibrate();
    }
  }

  playSound(type: string = 'chime'): void {
    // 使用系统声音API
    if (Platform.OS === 'android') {
      // Android上使用默认通知声音
      this.sendImmediateNotification('', '', false);
    } else {
      // iOS上使用震动作为声音反馈
      Vibration.vibrate();
    }
  }

  scheduleBlockEnd(blockName: string, endTime: number, blockId: string): string {
    const notificationId = `block_end_${blockId}`;
    
    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: '⏰ 时间块结束',
      message: `${blockName} 时间到了！`,
      date: new Date(endTime),
      channelId: "time-blocks",
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
    });

    return notificationId;
  }

  sendImmediateNotification(title: string, message: string, showNotification: boolean = true): void {
    if (showNotification) {
      PushNotification.localNotification({
        title,
        message,
        channelId: "time-blocks",
        vibrate: true,
        vibration: 300,
        playSound: true,
        soundName: 'default',
      });
    } else {
      // 只播放声音，不显示通知
      PushNotification.localNotification({
        title: '',
        message: '',
        channelId: "time-blocks",
        vibrate: false,
        playSound: true,
        soundName: 'default',
        ongoing: false,
        autoCancel: true,
      });
    }
  }

  cancelNotification(notificationId: string): void {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }
}

// ============================================================================
// 🎨 主应用组件（修复版）
// ============================================================================

const App: React.FC = () => {
  // 状态管理
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [majorBlocks, setMajorBlocks] = useState<TimeBlock[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // 修复：添加forceUpdate来正确触发重新渲染
  const [, setForceUpdate] = useState({});
  const forceUpdate = useCallback(() => setForceUpdate({}), []);
  
  // 主题状态
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');
  const [currentSeconds, setCurrentSeconds] = useState(0); // 添加秒数状态
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<{ parentId: string } | null>(null);
  const [pauseDestinationSelection, setPauseDestinationSelection] = useState(false);
  
  // 显示状态
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showDailyStats, setShowDailyStats] = useState(false);
  const [showMajorBlockSetup, setShowMajorBlockSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // 应用设置
  const [appSettings, setAppSettings] = useState<AppSettings>({
    countDirection: 'down',
    showSeconds: true, // 默认显示秒数
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
  });

  // 新建时间块状态
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockIcon, setNewBlockIcon] = useState('⭐');
  const [newBlockColor, setNewBlockColor] = useState('#7C3AED');
  const [newBlockDuration, setNewBlockDuration] = useState(60);

  // 管理器实例
  const dayTimeManager = useRef(new DayTimeManager()).current;
  const notificationManager = useRef(new NotificationManager()).current;
  const timerRef = useRef<number | null>(null);
  const displayTimerRef = useRef<number | null>(null);

  // 默认24小时模板（修复颜色对比度）
  const dayTemplates: DayTemplate[] = [
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

  // 颜色和图标选项（更清爽的颜色）
  const colorOptions = [
    '#7C3AED', '#FF6B9D', '#FFE066', '#00FFAA', '#00E4FF',
    '#C77DFF', '#00D4FF', '#00FF88', '#FF8C42', '#F59E0B'
  ];

  const emojiOptions = [
    '📚', '💼', '🍽️', '🏃‍♂️', '🧘‍♂️', '🎮', '🌙', '🚗',
    '☀️', '⭐', '🎯', '💡', '🎨', '🎵', '📱', '💻'
  ];

  // ============================================================================
  // 📱 生命周期和初始化（修复版）
  // ============================================================================

  useEffect(() => {
    initializeApp();
    return () => {
      // 修复：确保清理所有定时器
      cleanupTimers();
    };
  }, []);

  const cleanupTimers = useCallback(() => {
    if (timerRef.current) {
      BackgroundTimer.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (displayTimerRef.current) {
      clearInterval(displayTimerRef.current);
      displayTimerRef.current = null;
    }
  }, []);

  const initializeApp = async (): Promise<void> => {
    try {
      await loadSettings();
      await loadConfiguration();
      startTimers();
    } catch (error) {
      console.error('应用初始化失败:', error);
      // 修复：即使初始化失败也要设置为非首次使用，避免卡在加载状态
      setIsFirstTime(false);
      setShowMajorBlockSetup(true);
    }
  };

  const loadSettings = async (): Promise<void> => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setAppSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>): Promise<void> => {
    try {
      const updatedSettings = { ...appSettings, ...newSettings };
      setAppSettings(updatedSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  const loadConfiguration = async (): Promise<void> => {
    try {
      const savedConfig = await AsyncStorage.getItem('dayTimeConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.majorBlocks && config.timeBlocks) {
          setMajorBlocks(config.majorBlocks);
          setTimeBlocks(config.timeBlocks);
          dayTimeManager.setMajorBlocks(config.majorBlocks);
          initializeAllSessions(config.timeBlocks);
          setIsFirstTime(false);
        } else {
          throw new Error('配置数据格式错误');
        }
      } else {
        setShowMajorBlockSetup(true);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      setIsFirstTime(false);
      setShowMajorBlockSetup(true);
    }
  };

  const saveConfiguration = async (majorBlocks: TimeBlock[], timeBlocks: TimeBlock[]): Promise<void> => {
    try {
      const config = { majorBlocks, timeBlocks };
      await AsyncStorage.setItem('dayTimeConfig', JSON.stringify(config));
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const applyTemplate = (template: DayTemplate): void => {
    const newMajorBlocks = template.majorBlocks;
    const newTimeBlocks = template.subBlocks.reduce((acc, subBlock) => {
      const parentIndex = acc.findIndex(parent => parent.id === subBlock.parentId);
      if (parentIndex !== -1) {
        if (!acc[parentIndex].children) acc[parentIndex].children = [];
        acc[parentIndex].children!.push({
          id: `${subBlock.parentId}_${Date.now()}_${Math.random()}`,
          ...subBlock
        });
      }
      return acc;
    }, newMajorBlocks.map(major => ({ ...major, children: [] as TimeBlock[] })));

    setMajorBlocks(newMajorBlocks);
    setTimeBlocks(newTimeBlocks);
    dayTimeManager.setMajorBlocks(newMajorBlocks);
    initializeAllSessions(newTimeBlocks);
    saveConfiguration(newMajorBlocks, newTimeBlocks);
    setShowMajorBlockSetup(false);
    setIsFirstTime(false);
  };

  const initializeAllSessions = (blocks: TimeBlock[]): void => {
    blocks.forEach(parentBlock => {
      if (parentBlock.children) {
        parentBlock.children.forEach(childBlock => {
          dayTimeManager.initializeSession(childBlock);
        });
      }
    });
  };

  // ============================================================================
  // ⏰ 增强的计时器逻辑（修复版）
  // ============================================================================

  const startTimers = useCallback(() => {
    // 清理现有定时器
    cleanupTimers();
    
    // 主逻辑计时器 - 每分钟更新
    timerRef.current = BackgroundTimer.setInterval(() => {
      if (isRunning && currentSessionId && !isPaused) {
        const currentRemainingTime = dayTimeManager.getCurrentRemainingTime(currentSessionId);
        if (currentRemainingTime <= 0) {
          finishCurrentSession();
        }
      }
    }, 60000);

    // 显示更新计时器 - 每秒更新（修复：实时显示秒数）
    displayTimerRef.current = setInterval(() => {
      if (isRunning || isPaused) {
        setCurrentSeconds(prev => prev + 1);
        forceUpdate(); // 触发进度条动画更新
      }
    }, 1000);
  }, [isRunning, currentSessionId, isPaused, cleanupTimers, forceUpdate]);

  // 修复：当相关状态变化时重新启动定时器
  useEffect(() => {
    if (!isFirstTime) {
      startTimers();
    }
  }, [startTimers, isFirstTime]);

  const startSession = (block: TimeBlock): void => {
    const session = dayTimeManager.initializeSession(block);
    const startedSession = dayTimeManager.startSession(block.id);
    
    if (startedSession) {
      setCurrentSessionId(block.id);
      setIsRunning(true);
      setIsPaused(false);
      
      // 安排结束通知
      const endTime = Date.now() + (startedSession.remainingTime * 60000);
      notificationManager.scheduleBlockEnd(block.name, endTime, block.id);
      
      // 添加声音和震动反馈
      if (appSettings.soundEnabled) {
        notificationManager.playSound(appSettings.soundType);
      }
      if (appSettings.vibrationEnabled) {
        notificationManager.vibrate('start', appSettings.vibrationPattern);
      }
    }
  };

  const pauseCurrentSession = (): void => {
    if (currentSessionId && !isPaused) {
      // 修复：如果有默认暂停目标，直接使用
      if (appSettings.defaultPauseDestination) {
        confirmPause(appSettings.defaultPauseDestination);
      } else {
        setPauseDestinationSelection(true);
      }
    }
  };

  const confirmPause = (destinationBlockId: string): void => {
    if (currentSessionId) {
      const result = dayTimeManager.pauseSession(currentSessionId, destinationBlockId);
      if (result) {
        setIsPaused(true);
        setPauseDestinationSelection(false);
        
        notificationManager.cancelNotification(`block_end_${currentSessionId}`);
        
        // 播放声音和震动反馈
        if (appSettings.soundEnabled) {
          notificationManager.playSound(appSettings.soundType);
        }
        if (appSettings.vibrationEnabled) {
          notificationManager.vibrate('pause', appSettings.vibrationPattern);
        }
        
        Alert.alert(
          '会话已暂停',
          `${result.session.name} 已暂停\n工作了 ${result.activeTime} 分钟\n暂停时间将计入: ${result.targetBlock?.name || '未知'}`
        );
      }
    }
  };

  const resumeCurrentSession = (): void => {
    if (currentSessionId && isPaused) {
      const pauseDuration = dayTimeManager.endPauseTime(currentSessionId);
      const session = dayTimeManager.startSession(currentSessionId);
      
      if (session) {
        setIsPaused(false);
        
        // 重新安排结束通知
        const endTime = Date.now() + (session.remainingTime * 60000);
        notificationManager.scheduleBlockEnd(session.name, endTime, session.id);
        
        // 添加声音和震动反馈
        if (appSettings.soundEnabled) {
          notificationManager.playSound(appSettings.soundType);
        }
        if (appSettings.vibrationEnabled) {
          notificationManager.vibrate('start', appSettings.vibrationPattern);
        }
        
        Alert.alert(
          '会话已恢复',
          `暂停了 ${pauseDuration} 分钟\n已计入 ${dayTimeManager.pauseDestinationBlock?.name || '未知'}`
        );
      }
    }
  };

  const switchToSession = (newBlock: TimeBlock): void => {
    if (isPaused && currentSessionId) {
      dayTimeManager.endPauseTime(currentSessionId);
    }
    
    if (currentSessionId) {
      notificationManager.cancelNotification(`block_end_${currentSessionId}`);
    }
    
    const result = dayTimeManager.switchToSession(currentSessionId, newBlock.id);
    
    if (result.newSession) {
      setCurrentSessionId(newBlock.id);
      setIsRunning(true);
      setIsPaused(false);
      
      // 安排新的结束通知
      const endTime = Date.now() + (result.newSession.remainingTime * 60000);
      notificationManager.scheduleBlockEnd(newBlock.name, endTime, newBlock.id);
      
      // 添加声音和震动反馈
      if (appSettings.soundEnabled) {
        notificationManager.playSound(appSettings.soundType);
      }
      if (appSettings.vibrationEnabled) {
        notificationManager.vibrate('switch', appSettings.vibrationPattern);
      }
      
      Alert.alert('会话切换成功', `已切换到 ${newBlock.name}`);
    }
  };

  const finishCurrentSession = (): void => {
    if (currentSessionId) {
      if (isPaused) {
        dayTimeManager.endPauseTime(currentSessionId);
      }
      
      const session = dayTimeManager.sessions.get(currentSessionId);
      notificationManager.cancelNotification(`block_end_${currentSessionId}`);
      
      setIsRunning(false);
      setCurrentSessionId(null);
      setIsPaused(false);
      
      // 添加声音和震动反馈
      if (appSettings.soundEnabled) {
        notificationManager.sendImmediateNotification(
          '🎉 时间块完成！',
          `${session?.name || '未知任务'} 已完成`
        );
      }
      if (appSettings.vibrationEnabled) {
        notificationManager.vibrate('complete', appSettings.vibrationPattern);
      }
      
      Alert.alert(
        '🎉 时间块完成！',
        `${session?.name || '未知任务'} 已完成\n工作时间：${session?.totalUsedTime || 0} 分钟\n暂停时间：${session?.totalPauseTime || 0} 分钟`
      );
    }
  };

  // ============================================================================
  // 🎨 时间块管理增强（修复版）
  // ============================================================================

  const addChildBlock = (parentId: string): void => {
    if (!newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    const newChild: TimeBlock = {
      id: `child_${Date.now()}_${Math.random()}`,
      name: newBlockName,
      icon: newBlockIcon,
      color: newBlockColor,
      duration: newBlockDuration,
    };

    const updatedBlocks = timeBlocks.map(block => {
      if (block.id === parentId) {
        return {
          ...block,
          children: [...(block.children || []), newChild]
        };
      }
      return block;
    });

    setTimeBlocks(updatedBlocks);
    dayTimeManager.initializeSession(newChild);
    saveConfiguration(majorBlocks, updatedBlocks);
    closeModal();
  };

  const deleteTimeBlock = (blockId: string, parentId: string): void => {
    Alert.alert(
      '确认删除',
      appSettings.autoRedistribute ? 
        '删除后时间将重新分配给其他项目，确定吗？' : 
        '确定要删除这个时间块吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            let deletedDuration = 0;
            
            const updatedBlocks = timeBlocks.map(block => {
              if (block.id === parentId && block.children) {
                const deletedChild = block.children.find(child => child.id === blockId);
                deletedDuration = deletedChild ? deletedChild.duration : 0;
                
                const newChildren = block.children.filter(child => child.id !== blockId);
                
                // 如果启用自动重分配且还有其他子项目
                if (appSettings.autoRedistribute && newChildren.length > 0 && deletedDuration > 0) {
                  const totalCurrentTime = newChildren.reduce((sum, child) => sum + child.duration, 0);
                  if (totalCurrentTime > 0) {
                    newChildren.forEach(child => {
                      const proportion = child.duration / totalCurrentTime;
                      const additionalTime = Math.floor(deletedDuration * proportion);
                      child.duration += additionalTime;
                      
                      // 同步更新session数据
                      const session = dayTimeManager.sessions.get(child.id);
                      if (session) {
                        session.duration += additionalTime;
                        session.remainingTime += additionalTime;
                      }
                    });
                  }
                }
                
                return { ...block, children: newChildren };
              }
              return block;
            });
            
            setTimeBlocks(updatedBlocks);
            saveConfiguration(majorBlocks, updatedBlocks);
            
            if (appSettings.autoRedistribute && deletedDuration > 0) {
              Alert.alert('时间已重新分配', `已将 ${deletedDuration} 分钟重新分配给其他项目`);
            }
          }
        }
      ]
    );
  };

  const createTempBlock = (): void => {
    if (!newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    const tempBlock: TimeBlock = {
      id: `temp_${Date.now()}`,
      name: newBlockName,
      duration: newBlockDuration,
      icon: '⚡',
      color: '#ff6b6b',
      isTemporary: true,
    };

    if (timeBlocks.length > 0) {
      const updatedBlocks = timeBlocks.map((block, index) => {
        if (index === 0) {
          return {
            ...block,
            children: [...(block.children || []), tempBlock]
          };
        }
        return block;
      });

      setTimeBlocks(updatedBlocks);
      dayTimeManager.initializeSession(tempBlock);
      saveConfiguration(majorBlocks, updatedBlocks);
    }

    closeModal();
    Alert.alert('临时时间块已创建', `${newBlockName} (${newBlockDuration}分钟)`);
  };

  const resetTimeBlock = (blockId: string): void => {
    dayTimeManager.resetSession(blockId);
    forceUpdate(); // 触发重新渲染
    Alert.alert('重置完成', '时间块已重置到初始状态');
  };

  const toggleParentBlockCollapse = (parentId: string): void => {
    const currentState = dayTimeManager.getCollapseState(parentId);
    dayTimeManager.setCollapseState(parentId, !currentState);
    forceUpdate(); // 触发重新渲染
  };

  const closeModal = (): void => {
    setModalVisible(false);
    setModalType(null);
    setEditingBlock(null);
    setNewBlockName('');
    setNewBlockIcon('⭐');
    setNewBlockColor('#7C3AED');
    setNewBlockDuration(60);
  };

  // ============================================================================
  // 🎨 工具函数（修复版）
  // ============================================================================

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const formatTimeWithSeconds = (minutes: number, seconds = 0): string => {
    if (appSettings.showSeconds) {
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

  const getCurrentDisplayTime = (): string => {
    if (!currentSessionId) return '00:00';
    
    if (isPaused) {
      const pauseTime = dayTimeManager.getCurrentPauseTime(currentSessionId);
      return formatTimeWithSeconds(pauseTime.minutes, pauseTime.seconds);
    }
    
    if (appSettings.countDirection === 'down') {
      const remaining = dayTimeManager.getCurrentRemainingTime(currentSessionId);
      return formatTimeWithSeconds(remaining.minutes, remaining.seconds);
    } else {
      const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
      return formatTimeWithSeconds(elapsed.minutes, elapsed.seconds);
    }
  };

  const getCurrentSessionDisplayName = (): string => {
    if (!currentSessionId) return '';
    
    const session = dayTimeManager.sessions.get(currentSessionId);
    if (!session) return '';
    
    if (isPaused) {
      return `${session.name} - 已暂停`;
    }
    
    return session.name;
  };

  const getProgressPercentage = (): number => {
    if (!currentSessionId) return 0;
    
    const session = dayTimeManager.sessions.get(currentSessionId);
    if (!session) return 0;
    
    const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
    const totalElapsedMinutes = elapsed.minutes + elapsed.seconds / 60; // 包含秒数的精确计算
    return Math.min((totalElapsedMinutes / session.duration) * 100, 100);
  };

  const renderProgressBar = (current: number, total: number, color: string) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${Math.min((current / total) * 100, 100)}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>
        {Math.round(Math.min((current / total) * 100, 100))}%
      </Text>
    </View>
  );

  // ============================================================================
  // 🎨 渲染组件（部分修复）
  // ============================================================================

  const renderCurrentSession = () => {
    if (!currentSessionId) return null;

    const session = dayTimeManager.sessions.get(currentSessionId);
    if (!session) return null;

    return (
      <View style={[
        styles.currentSessionCard,
        appSettings.focusMode && styles.focusMode
      ]}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionIcon}>{session.icon}</Text>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{getCurrentSessionDisplayName()}</Text>
            <Text style={styles.sessionTime}>{getCurrentDisplayTime()}</Text>
            {!isPaused && (
              <Text style={styles.sessionElapsed}>
                已用: {(() => {
                  const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
                  return formatTime(elapsed.minutes);
                })()}
              </Text>
            )}
          </View>
          
          {!isPaused ? (
            <TouchableOpacity onPress={pauseCurrentSession} style={styles.pauseButton}>
              <Text style={styles.pauseButtonText}>⏸️</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={resumeCurrentSession} style={styles.resumeButton}>
              <Text style={styles.resumeButtonText}>▶️</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {!isPaused && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: session.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(getProgressPercentage())}%</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMajorBlocks = () => {
    if (isFirstTime || !appSettings.showMajorBlocks) return null;

    return (
      <View style={styles.majorBlocksContainer}>
        <Text style={styles.sectionTitle}>24小时时间分配</Text>
        {majorBlocks.map(block => {
          const consumed = block.consumedTime || 0;
          const remaining = block.duration - consumed;

          return (
            <View key={block.id} style={[styles.majorBlockCard, { borderLeftColor: block.color }]}>
              <View style={styles.majorBlockHeader}>
                <Text style={styles.majorBlockName}>{block.name}</Text>
                <Text style={styles.majorBlockTime}>
                  {formatTime(consumed)} / {formatTime(block.duration)}
                </Text>
              </View>
              {renderProgressBar(consumed, block.duration, block.color)}
            </View>
          );
        })}
      </View>
    );
  };

  const renderTimeBlockSelector = () => {
    if (isFirstTime) return null;

    const allBlocks: Array<TimeBlock & { remainingTime: number; isActive: boolean }> = [];
    timeBlocks.forEach(parentBlock => {
      if (parentBlock.children) {
        parentBlock.children.forEach(child => {
          const session = dayTimeManager.sessions.get(child.id);
          if (session && session.remainingTime > 0) {
            allBlocks.push({
              ...child,
              remainingTime: session.remainingTime,
              isActive: session.isActive && !isPaused,
            });
          }
        });
      }
    });

    return (
      <View>
        <Text style={styles.sectionTitle}>时间块切换</Text>
        <ScrollView horizontal style={styles.blockSelector} showsHorizontalScrollIndicator={false}>
          {allBlocks.map(block => (
            <TouchableOpacity
              key={block.id}
              onPress={() => {
                if (currentSessionId === block.id) {
                  if (isPaused) {
                    resumeCurrentSession();
                  } else {
                    pauseCurrentSession();
                  }
                } else {
                  if (currentSessionId) {
                    switchToSession(block);
                  } else {
                    startSession(block);
                  }
                }
              }}
              style={[
                styles.blockSelectorItem,
                { 
                  backgroundColor: block.color,
                  opacity: block.isActive ? 1 : 0.7,
                  borderWidth: currentSessionId === block.id ? 3 : 0,
                  borderColor: '#fff'
                }
              ]}
            >
              <Text style={styles.blockSelectorIcon}>{block.icon}</Text>
              <Text style={styles.blockSelectorName}>{block.name}</Text>
              <Text style={styles.blockSelectorTime}>{formatTime(block.remainingTime)}</Text>
              {block.isTemporary && <Text style={styles.tempLabel}>临时</Text>}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            onPress={() => {
              setModalType('tempBlock');
              setModalVisible(true);
            }}
            style={styles.addTempButton}
          >
            <Text style={styles.addTempButtonText}>⚡</Text>
            <Text style={styles.addTempButtonLabel}>临时块</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderTimeBlocks = () => {
    if (isFirstTime) return null;

    return (
      <View>
        {timeBlocks.map(parentBlock => {
          const isCollapsed = dayTimeManager.getCollapseState(parentBlock.id);
          const hasActiveChild = parentBlock.children?.some(child => child.id === currentSessionId);
          
          // 如果开启自动折叠且当前块没有运行的子项目，则自动折叠
          const shouldCollapse = appSettings.autoCollapse && currentSessionId && !hasActiveChild;
          const actuallyCollapsed = shouldCollapse || isCollapsed;

          return (
            <View key={parentBlock.id} style={[
              styles.parentBlock,
              hasActiveChild && styles.activeParentBlock,
              actuallyCollapsed && styles.collapsedParentBlock
            ]}>
              <TouchableOpacity
                onPress={() => toggleParentBlockCollapse(parentBlock.id)}
                style={[styles.parentBlockHeader, { backgroundColor: parentBlock.color }]}
              >
                <View style={styles.parentBlockTitle}>
                  <Text style={styles.parentIcon}>{parentBlock.icon || '📁'}</Text>
                  <Text style={styles.parentName}>{parentBlock.name}</Text>
                  <Text style={[styles.collapseIndicator, actuallyCollapsed && styles.collapseIndicatorCollapsed]}>
                    ▼
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setModalType('addChild');
                    setEditingBlock({ parentId: parentBlock.id });
                    setModalVisible(true);
                  }}
                  style={styles.addChildButton}
                >
                  <Text style={styles.addChildButtonText}>+ 添加</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {!actuallyCollapsed && (
                <View style={styles.childrenContainer}>
                  {parentBlock.children?.map(childBlock => {
                    const session = dayTimeManager.sessions.get(childBlock.id);
                    const isActive = session?.isActive && !isPaused;
                    const remainingTime = session?.remainingTime || childBlock.duration;
                    const usedTime = session?.totalUsedTime || 0;
                    const pauseTime = session?.totalPauseTime || 0;

                    return (
                      <View key={childBlock.id} style={[
                        styles.childBlock,
                        { borderLeftColor: childBlock.color },
                        isActive && styles.activeChildBlock
                      ]}>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteTimeBlock(childBlock.id, parentBlock.id)}
                        >
                          <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.childContent}
                          onPress={() => {
                            if (currentSessionId === childBlock.id) {
                              if (isPaused) {
                                resumeCurrentSession();
                              } else {
                                pauseCurrentSession();
                              }
                            } else {
                              if (currentSessionId) {
                                switchToSession(childBlock);
                              } else {
                                startSession(childBlock);
                              }
                            }
                          }}
                          onLongPress={() => {
                            Alert.alert(
                              childBlock.name,
                              '选择操作',
                              [
                                { text: '重置', onPress: () => resetTimeBlock(childBlock.id) },
                                { text: '取消', style: 'cancel' }
                              ]
                            );
                          }}
                        >
                          <Text style={styles.childIcon}>{childBlock.icon}</Text>
                          <View style={styles.childInfo}>
                            <Text style={styles.childName}>{childBlock.name}</Text>
                            <Text style={styles.childTime}>剩余: {formatTime(remainingTime)}</Text>
                            <Text style={styles.childUsed}>已用: {formatTime(usedTime)}</Text>
                            {pauseTime > 0 && (
                              <Text style={styles.pauseInfo}>暂停: {formatTime(pauseTime)}</Text>
                            )}
                            {childBlock.isTemporary && (
                              <Text style={styles.tempIndicator}>临时</Text>
                            )}
                          </View>
                          {currentSessionId === childBlock.id && (
                            <View style={styles.activeIndicator}>
                              <Text style={styles.activeIndicatorText}>
                                {isPaused ? '⏸️' : '▶️'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderActivityLogItem = ({ item }: { item: ActivityLog }) => {
    const typeColors: Record<ActivityLog['type'], string> = {
      start: '#4CAF50',
      pause: '#FF9800',
      switch: '#2196F3',
      complete: '#9C27B0',
      pause_end: '#00BCD4',
      major_block_consume: '#FF5722',
    };

    const typeIcons: Record<ActivityLog['type'], string> = {
      start: '▶️',
      pause: '⏸️',
      switch: '🔄',
      complete: '✅',
      pause_end: '💤',
      major_block_consume: '📊',
    };

    return (
      <View style={styles.activityLogItem}>
        <View style={[styles.activityIcon, { backgroundColor: typeColors[item.type] || '#666' }]}>
          <Text style={styles.activityIconText}>{typeIcons[item.type] || '📝'}</Text>
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityDescription}>{item.description}</Text>
          <Text style={styles.activityTime}>
            {item.timestamp.toLocaleTimeString()} 
            {item.duration > 0 && ` | 时长: ${item.duration}分钟`}
          </Text>
        </View>
      </View>
    );
  };

  // ============================================================================
  // 🎨 主界面渲染
  // ============================================================================

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent={true}
        hidden={false}
      />
      
      {/* 顶部控制栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowDailyStats(true)} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>📊</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>身体感知时间管理</Text>
        
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 当前会话显示 */}
      {renderCurrentSession()}

      <ScrollView style={styles.scrollView}>
        {/* 主要时间块状态 */}
        {renderMajorBlocks()}

        {/* 时间块选择器 */}
        {renderTimeBlockSelector()}

        {/* 时间块列表 */}
        {renderTimeBlocks()}
      </ScrollView>

      {/* 24小时模板设置模态框 */}
      <Modal visible={showMajorBlockSetup} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择24小时模板</Text>
          </View>
          <ScrollView style={styles.templateList}>
            {dayTemplates.map((template, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => applyTemplate(template)}
                style={styles.templateCard}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>
                  主要时间块: {template.majorBlocks.map(b => b.name).join(', ')}
                </Text>
                <Text style={styles.templateSubBlocks}>
                  包含 {template.subBlocks.length} 个子时间块
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 暂停目标选择模态框 */}
      <Modal visible={pauseDestinationSelection} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPauseDestinationSelection(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>暂停时间计入哪里？</Text>
            <Text style={styles.modalSubtitle}>选择暂停时间应该从哪个时间块中扣除</Text>
            
            {majorBlocks.map(block => (
              <TouchableOpacity
                key={block.id}
                onPress={() => confirmPause(block.id)}
                onLongPress={() => {
                  // 长按设置为默认选择
                  saveSettings({ defaultPauseDestination: block.id });
                  Alert.alert('已设为默认', `今后暂停将默认计入: ${block.name}`);
                  confirmPause(block.id);
                }}
                style={[styles.destinationOption, { borderColor: block.color }]}
              >
                <Text style={[styles.destinationName, { color: block.color }]}>
                  {block.name}
                  {appSettings.defaultPauseDestination === block.id && ' (默认)'}
                </Text>
                <Text style={styles.destinationInfo}>
                  剩余: {formatTime(block.duration - (block.consumedTime || 0))}
                </Text>
                <Text style={styles.destinationHint}>
                  长按设为默认选择
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              onPress={() => setPauseDestinationSelection(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 设置模态框 */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettings(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>应用设置</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>主题模式</Text>
              <View style={styles.settingButtons}>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.theme === 'light' && styles.settingButtonActive]}
                  onPress={() => saveSettings({ theme: 'light' })}
                >
                  <Text style={styles.settingButtonText}>浅色</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.theme === 'dark' && styles.settingButtonActive]}
                  onPress={() => saveSettings({ theme: 'dark' })}
                >
                  <Text style={styles.settingButtonText}>深色</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.theme === 'auto' && styles.settingButtonActive]}
                  onPress={() => saveSettings({ theme: 'auto' })}
                >
                  <Text style={styles.settingButtonText}>自动</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>计时方向</Text>
              <View style={styles.settingButtons}>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.countDirection === 'down' && styles.settingButtonActive]}
                  onPress={() => {
                    saveSettings({ countDirection: 'down' });
                    startTimers();
                  }}
                >
                  <Text style={styles.settingButtonText}>倒计时</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.countDirection === 'up' && styles.settingButtonActive]}
                  onPress={() => {
                    saveSettings({ countDirection: 'up' });
                    startTimers();
                  }}
                >
                  <Text style={styles.settingButtonText}>正计时</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>震动强度</Text>
              <View style={styles.settingButtons}>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.vibrationPattern === 'light' && styles.settingButtonActive]}
                  onPress={() => saveSettings({ vibrationPattern: 'light' })}
                >
                  <Text style={styles.settingButtonText}>轻</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.vibrationPattern === 'medium' && styles.settingButtonActive]}
                  onPress={() => saveSettings({ vibrationPattern: 'medium' })}
                >
                  <Text style={styles.settingButtonText}>中</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.vibrationPattern === 'strong' && styles.settingButtonActive]}
                  onPress={() => saveSettings({ vibrationPattern: 'strong' })}
                >
                  <Text style={styles.settingButtonText}>强</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>默认暂停目标</Text>
              <View style={styles.settingButtons}>
                {majorBlocks.map(block => (
                  <TouchableOpacity
                    key={block.id}
                    style={[styles.settingButton, appSettings.defaultPauseDestination === block.id && styles.settingButtonActive]}
                    onPress={() => saveSettings({ defaultPauseDestination: block.id })}
                  >
                    <Text style={styles.settingButtonText}>{block.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.settingButton, appSettings.defaultPauseDestination === null && styles.settingButtonActive]}
                  onPress={() => saveSettings({ defaultPauseDestination: null })}
                >
                  <Text style={styles.settingButtonText}>每次选择</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>显示秒数</Text>
              <Switch
                value={appSettings.showSeconds}
                onValueChange={(value) => saveSettings({ showSeconds: value })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>自动折叠</Text>
              <Switch
                value={appSettings.autoCollapse}
                onValueChange={(value) => saveSettings({ autoCollapse: value })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>显示24小时分配</Text>
              <Switch
                value={appSettings.showMajorBlocks}
                onValueChange={(value) => saveSettings({ showMajorBlocks: value })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>焦点模式</Text>
              <Switch
                value={appSettings.focusMode}
                onValueChange={(value) => saveSettings({ focusMode: value })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>声音提醒</Text>
              <Switch
                value={appSettings.soundEnabled}
                onValueChange={(value) => saveSettings({ soundEnabled: value })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>震动提醒</Text>
              <Switch
                value={appSettings.vibrationEnabled}
                onValueChange={(value) => saveSettings({ vibrationEnabled: value })}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>删除后重分配时间</Text>
              <Switch
                value={appSettings.autoRedistribute}
                onValueChange={(value) => saveSettings({ autoRedistribute: value })}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowActivityLog(true)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>活动日志</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>完成</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 添加时间块模态框 */}
      <Modal visible={modalType === 'addChild' && modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加时间块</Text>
            
            <Text style={styles.inputLabel}>名称:</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockName}
              onChangeText={setNewBlockName}
              placeholder="输入时间块名称"
              placeholderTextColor="#888"
            />
            
            <Text style={styles.inputLabel}>图标:</Text>
            <ScrollView horizontal style={styles.emojiContainer}>
              {emojiOptions.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setNewBlockIcon(emoji)}
                  style={[
                    styles.emojiOption,
                    newBlockIcon === emoji && styles.selectedEmoji
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.inputLabel}>颜色:</Text>
            <View style={styles.colorContainer}>
              {colorOptions.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewBlockColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newBlockColor === color && styles.selectedColor
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.inputLabel}>时长 (分钟):</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockDuration.toString()}
              onChangeText={(text) => setNewBlockDuration(parseInt(text) || 0)}
              placeholder="输入时长"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => editingBlock && addChildBlock(editingBlock.parentId)} 
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 临时时间块创建模态框 */}
      <Modal visible={modalType === 'tempBlock' && modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建临时时间块</Text>
            
            <Text style={styles.inputLabel}>名称:</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockName}
              onChangeText={setNewBlockName}
              placeholder="输入临时时间块名称"
              placeholderTextColor="#888"
            />
            
            <Text style={styles.inputLabel}>时长 (分钟):</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockDuration.toString()}
              onChangeText={(text) => setNewBlockDuration(parseInt(text) || 0)}
              placeholder="输入时长"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={createTempBlock} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 活动日志模态框 */}
      <Modal visible={showActivityLog} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>24小时活动记录</Text>
            <TouchableOpacity onPress={() => setShowActivityLog(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={dayTimeManager.getActivityLog()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderActivityLogItem}
            style={styles.activityLogList}
          />
        </View>
      </Modal>

      {/* 每日统计模态框 */}
      <Modal visible={showDailyStats} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>今日统计</Text>
            <TouchableOpacity onPress={() => setShowDailyStats(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            {(() => {
              const stats = dayTimeManager.getDailyStats();
              return (
                <View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>总活跃时间:</Text>
                    <Text style={styles.statValue}>{formatTime(stats.totalActiveTime)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>总暂停时间:</Text>
                    <Text style={styles.statValue}>{formatTime(stats.totalPauseTime)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>完成任务数:</Text>
                    <Text style={styles.statValue}>{stats.completedTasks}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>切换次数:</Text>
                    <Text style={styles.statValue}>{stats.switchCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>暂停次数:</Text>
                    <Text style={styles.statValue}>{stats.pauseCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>活动记录数:</Text>
                    <Text style={styles.statValue}>{stats.totalActivities}</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// 🎨 样式定义
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    backgroundColor: '#1a1a2e',
    paddingTop: 50, // 增加顶部padding适应透明状态栏
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
  },
  currentSessionCard: {
    backgroundColor: '#16213e',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  focusMode: {
    backgroundColor: '#667eea',
    padding: 30,
    margin: 15,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sessionIcon: {
    fontSize: 32,
    marginRight: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  sessionTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 5,
  },
  sessionElapsed: {
    fontSize: 14,
    color: '#888',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 20,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButtonText: {
    fontSize: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  majorBlocksContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  majorBlockCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  majorBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  majorBlockName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  majorBlockTime: {
    color: '#888',
    fontSize: 14,
  },
  blockSelector: {
    marginBottom: 15,
    maxHeight: 120,
  },
  blockSelectorItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  blockSelectorIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  blockSelectorName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  blockSelectorTime: {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.8,
  },
  tempLabel: {
    color: '#ffffff',
    fontSize: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  addTempButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  addTempButtonText: {
    fontSize: 20,
    marginBottom: 5,
  },
  addTempButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  parentBlock: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  activeParentBlock: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    elevation: 8,
  },
  collapsedParentBlock: {
    opacity: 0.7,
  },
  parentBlockHeader: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parentBlockTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  parentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  collapseIndicator: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 10,
    transform: [{ rotate: '0deg' }],
  },
  collapseIndicatorCollapsed: {
    transform: [{ rotate: '-90deg' }],
  },
  addChildButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addChildButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  childrenContainer: {
    padding: 10,
  },
  childBlock: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    position: 'relative',
  },
  activeChildBlock: {
    backgroundColor: '#2a3f5f',
    elevation: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#D0021B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  childContent: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  childTime: {
    fontSize: 12,
    color: '#4A90E2',
    marginBottom: 1,
  },
  childUsed: {
    fontSize: 12,
    color: '#888',
    marginBottom: 1,
  },
  pauseInfo: {
    fontSize: 10,
    color: '#FF9800',
    marginBottom: 1,
  },
  tempIndicator: {
    fontSize: 8,
    color: '#FF5722',
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicatorText: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  modalHeader: {
    backgroundColor: '#1a1a2e',
    paddingTop: 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 24,
    color: '#ffffff',
    padding: 5,
  },
  templateList: {
    flex: 1,
    padding: 20,
  },
  templateCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  templateDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
  },
  templateSubBlocks: {
    fontSize: 12,
    color: '#4A90E2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 25,
    width: width * 0.9,
    maxWidth: 400,
    maxHeight: height * 0.8,
  },
  destinationOption: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  destinationInfo: {
    fontSize: 12,
    color: '#888',
  },
  destinationHint: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
  },
  settingButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  settingButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  settingButtonActive: {
    backgroundColor: '#4A90E2',
  },
  settingButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 5,
    marginTop: 15,
  },
  textInput: {
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  emojiContainer: {
    maxHeight: 50,
    marginTop: 5,
  },
  emojiOption: {
    padding: 8,
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
  },
  selectedEmoji: {
    backgroundColor: '#4A90E2',
  },
  emojiText: {
    fontSize: 20,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 5,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  cancelButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  saveButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flex: 1,
  },
  secondaryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  activityLogList: {
    flex: 1,
    padding: 15,
  },
  activityLogItem: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    color: '#888',
    fontSize: 12,
  },
  statsContainer: {
    padding: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statLabel: {
    color: '#ffffff',
    fontSize: 16,
  },
  statValue: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;