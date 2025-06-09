// App.js - 更新版完整单文件，整合所有功能改进
import React, { useState, useEffect, useRef } from 'react';
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
// 🧠 增强的时间管理类
// ============================================================================

class DayTimeManager {
  constructor() {
    this.sessions = new Map();
    this.activityLog = [];
    this.majorBlocks = [];
    this.pauseDestinationBlock = null;
    this.collapseStates = new Map();
  }

  setMajorBlocks(blocks) {
    this.majorBlocks = blocks.map(block => ({
      ...block,
      consumedTime: block.consumedTime || 0,
    }));
    
    this.pauseDestinationBlock = this.majorBlocks.find(block => 
      block.type === 'rest' || 
      block.name.includes('休息') || 
      block.name.includes('睡眠')
    ) || this.majorBlocks[1];
  }

  initializeSession(block) {
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
        accumulatedTime: 0, // 累计已用时间
      });
    }
    return this.sessions.get(block.id);
  }

  startSession(blockId) {
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

  pauseSession(blockId, destinationBlockId = null) {
    const session = this.sessions.get(blockId);
    if (!session || !session.isActive) return null;

    const pauseStartTime = Date.now();
    const activeTime = Math.floor((pauseStartTime - session.lastStartTime) / 60000);
    
    // 更新累计时间
    session.accumulatedTime += activeTime;
    session.remainingTime = Math.max(0, session.remainingTime - activeTime);
    session.totalUsedTime += activeTime;
    session.isActive = false;
    session.pauseStartTime = pauseStartTime;
    
    const targetBlock = destinationBlockId ? 
      this.majorBlocks.find(b => b.id === destinationBlockId) : 
      this.pauseDestinationBlock;
    
    session.currentPauseTarget = targetBlock;
    
    this.logActivity('pause', 
      `暂停 ${session.name}，时间将计入 ${targetBlock?.name}`, 
      session.remainingTime, 
      activeTime
    );
    
    return { session, activeTime, targetBlock };
  }

  endPauseTime(blockId) {
    const session = this.sessions.get(blockId);
    if (!session || !session.pauseStartTime) return 0;

    const pauseDuration = Math.floor((Date.now() - session.pauseStartTime) / 60000);
    const targetBlock = session.currentPauseTarget;
    
    session.totalPauseTime += pauseDuration;
    session.pauseStartTime = null;
    session.currentPauseTarget = null;
    
    if (targetBlock) {
      this.consumeMajorBlockTime(targetBlock.id, pauseDuration);
    }
    
    session.pauseHistory.push({
      duration: pauseDuration,
      timestamp: new Date(),
      targetBlock: targetBlock?.name,
    });
    
    this.logActivity('pause_end', 
      `结束暂停，暂停了 ${pauseDuration} 分钟，计入 ${targetBlock?.name}`,
      0, 
      pauseDuration
    );
    
    return pauseDuration;
  }

  consumeMajorBlockTime(blockId, minutes) {
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

  switchToSession(fromBlockId, toBlockId, pauseDestination = null) {
    let pauseResult = null;
    
    if (fromBlockId) {
      pauseResult = this.pauseSession(fromBlockId, pauseDestination);
    }
    
    const newSession = this.startSession(toBlockId);
    
    this.logActivity('switch', 
      `从 ${this.sessions.get(fromBlockId)?.name || '无'} 切换到 ${newSession?.name}`,
      newSession?.remainingTime
    );
    
    return { pauseResult, newSession };
  }

  // 删除时间块后重新分配时间
  redistributeTimeAfterDeletion(parentId, deletedDuration) {
    const parent = this.majorBlocks.find(b => b.id === parentId);
    if (!parent || !parent.children || parent.children.length === 0) return;

    const remainingChildren = parent.children;
    const totalCurrentTime = remainingChildren.reduce((sum, child) => sum + child.duration, 0);
    
    if (totalCurrentTime > 0) {
      remainingChildren.forEach(child => {
        const proportion = child.duration / totalCurrentTime;
        const additionalTime = Math.floor(deletedDuration * proportion);
        child.duration += additionalTime;
        
        // 更新session中的剩余时间
        const session = this.sessions.get(child.id);
        if (session) {
          session.remainingTime += additionalTime;
        }
      });
    }
  }

  getCurrentPauseTime(blockId) {
    const session = this.sessions.get(blockId);
    if (session && session.pauseStartTime) {
      return Math.floor((Date.now() - session.pauseStartTime) / 60000);
    }
    return 0;
  }

  getCurrentElapsedTime(blockId) {
    const session = this.sessions.get(blockId);
    if (session && session.isActive && session.lastStartTime) {
      const currentElapsed = Math.floor((Date.now() - session.lastStartTime) / 60000);
      return session.accumulatedTime + currentElapsed;
    }
    return session ? session.accumulatedTime : 0;
  }

  getCurrentRemainingTime(blockId) {
    const session = this.sessions.get(blockId);
    if (session && session.isActive && session.lastStartTime) {
      const currentElapsed = Math.floor((Date.now() - session.lastStartTime) / 60000);
      return Math.max(0, session.remainingTime - currentElapsed);
    }
    return session ? session.remainingTime : 0;
  }

  getMajorBlocksStatus() {
    return this.majorBlocks.map(block => ({
      ...block,
      remaining: block.duration - (block.consumedTime || 0),
      progressPercent: ((block.consumedTime || 0) / block.duration) * 100
    }));
  }

  logActivity(type, description, remainingTime = 0, duration = 0) {
    const activity = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      type,
      description,
      remainingTime,
      duration,
      majorBlocksStatus: this.getMajorBlocksStatus(),
    };
    
    this.activityLog.push(activity);
    
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.activityLog = this.activityLog.filter(log => log.timestamp.getTime() > oneDayAgo);
  }

  resetSession(blockId) {
    const session = this.sessions.get(blockId);
    if (session) {
      session.remainingTime = session.duration;
      session.totalUsedTime = 0;
      session.totalPauseTime = 0;
      session.isActive = false;
      session.lastStartTime = null;
      session.pauseStartTime = null;
      session.pauseHistory = [];
      session.currentPauseTarget = null;
      session.accumulatedTime = 0;
    }
  }

  getActivityLog() {
    return this.activityLog.slice().reverse();
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

  // 折叠状态管理
  setCollapseState(parentId, isCollapsed) {
    this.collapseStates.set(parentId, isCollapsed);
  }

  getCollapseState(parentId) {
    return this.collapseStates.get(parentId) || false;
  }
}

// ============================================================================
// 🔔 增强的通知管理器
// ============================================================================

class NotificationManager {
  constructor() {
    this.configure();
    this.vibrationPatterns = {
      start: [100, 50, 100],
      pause: [200, 100, 200],
      complete: [1000, 500, 1000, 500, 1000],
      switch: [100, 50, 100, 50, 100],
    };
  }

  configure() {
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

  vibrate(type = 'start') {
    const pattern = this.vibrationPatterns[type] || this.vibrationPatterns.start;
    Vibration.vibrate(pattern);
  }

  scheduleBlockEnd(blockName, endTime, blockId) {
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

  sendImmediateNotification(title, message) {
    PushNotification.localNotification({
      title,
      message,
      channelId: "time-blocks",
      vibrate: true,
      vibration: 300,
      playSound: true,
      soundName: 'default',
    });
  }

  cancelNotification(notificationId) {
    PushNotification.cancelLocalNotifications({ id: notificationId.toString() });
  }
}

// ============================================================================
// 🎨 主应用组件
// ============================================================================

const App = () => {
  // 状态管理
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [majorBlocks, setMajorBlocks] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null);
  const [pauseDestinationSelection, setPauseDestinationSelection] = useState(false);
  
  // 显示状态
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showDailyStats, setShowDailyStats] = useState(false);
  const [showMajorBlockSetup, setShowMajorBlockSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // 应用设置
  const [appSettings, setAppSettings] = useState({
    countDirection: 'down', // 'up' | 'down'
    showSeconds: false,
    updateInterval: 1, // 秒
    autoCollapse: true,
    showMajorBlocks: false, // 默认隐藏24小时分配
    focusMode: true,
    soundEnabled: true,
    vibrationEnabled: true,
    autoRedistribute: true,
  });

  // 新建时间块状态
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockIcon, setNewBlockIcon] = useState('⭐');
  const [newBlockColor, setNewBlockColor] = useState('#667eea');
  const [newBlockDuration, setNewBlockDuration] = useState(60);

  // 管理器实例
  const dayTimeManager = useRef(new DayTimeManager()).current;
  const notificationManager = useRef(new NotificationManager()).current;
  const timerRef = useRef(null);
  const displayTimerRef = useRef(null);

  // 默认24小时模板
  const dayTemplates = [
    {
      name: '工作日模板',
      majorBlocks: [
        { id: 'awake', name: '清醒工作时间', duration: 16 * 60, type: 'active', color: '#4facfe' },
        { id: 'rest', name: '休息睡眠时间', duration: 8 * 60, type: 'rest', color: '#43e97b' },
      ],
      subBlocks: [
        { parentId: 'awake', name: '专注学习1', duration: 240, icon: '📚', color: '#f093fb' },
        { parentId: 'awake', name: '早餐时间', duration: 30, icon: '🥞', color: '#ffecd2' },
        { parentId: 'awake', name: '专注学习2', duration: 240, icon: '📚', color: '#f093fb' },
        { parentId: 'awake', name: '午餐时间', duration: 45, icon: '🍽️', color: '#ffecd2' },
        { parentId: 'awake', name: '运动时间', duration: 60, icon: '🏃‍♂️', color: '#a8edea' },
        { parentId: 'awake', name: '项目开发', duration: 180, icon: '💻', color: '#d299c2' },
        { parentId: 'awake', name: '晚餐时间', duration: 45, icon: '🍽️', color: '#ffecd2' },
        { parentId: 'awake', name: '自由时间', duration: 120, icon: '🎮', color: '#89f7fe' },
        { parentId: 'rest', name: '夜间睡眠', duration: 420, icon: '🌙', color: '#667eea' },
        { parentId: 'rest', name: '放松休息', duration: 60, icon: '🧘‍♂️', color: '#89f7fe' },
      ]
    },
    {
      name: '学习日模板',
      majorBlocks: [
        { id: 'study', name: '学习专注时间', duration: 14 * 60, type: 'active', color: '#667eea' },
        { id: 'life', name: '生活休息时间', duration: 10 * 60, type: 'rest', color: '#764ba2' },
      ],
      subBlocks: [
        { parentId: 'study', name: '数学学习', duration: 180, icon: '🔢', color: '#f093fb' },
        { parentId: 'study', name: '编程练习', duration: 240, icon: '💻', color: '#4facfe' },
        { parentId: 'study', name: '英语学习', duration: 120, icon: '🔤', color: '#43e97b' },
        { parentId: 'study', name: '项目实践', duration: 300, icon: '🛠️', color: '#fa709a' },
        { parentId: 'life', name: '睡眠时间', duration: 480, icon: '🌙', color: '#667eea' },
        { parentId: 'life', name: '用餐休息', duration: 120, icon: '🍽️', color: '#ffecd2' },
      ]
    }
  ];

  // 颜色和图标选项
  const colorOptions = [
    '#667eea', '#f093fb', '#ffecd2', '#a8edea', '#89f7fe',
    '#d299c2', '#4facfe', '#43e97b', '#fa709a', '#fee140'
  ];

  const emojiOptions = [
    '📚', '💼', '🍽️', '🏃‍♂️', '🧘‍♂️', '🎮', '🌙', '🚗',
    '☀️', '⭐', '🎯', '💡', '🎨', '🎵', '📱', '💻'
  ];

  // ============================================================================
  // 📱 生命周期和初始化
  // ============================================================================

  useEffect(() => {
    initializeApp();
    return () => {
      if (timerRef.current) BackgroundTimer.clearInterval(timerRef.current);
      if (displayTimerRef.current) clearInterval(displayTimerRef.current);
    };
  }, []);

  const initializeApp = async () => {
    await loadSettings();
    await loadConfiguration();
    startTimers();
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setAppSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...appSettings, ...newSettings };
      setAppSettings(updatedSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };

  const loadConfiguration = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('dayTimeConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setMajorBlocks(config.majorBlocks);
        setTimeBlocks(config.timeBlocks);
        dayTimeManager.setMajorBlocks(config.majorBlocks);
        initializeAllSessions(config.timeBlocks);
        setIsFirstTime(false);
      } else {
        setShowMajorBlockSetup(true);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      setShowMajorBlockSetup(true);
    }
  };

  const saveConfiguration = async (majorBlocks, timeBlocks) => {
    try {
      const config = { majorBlocks, timeBlocks };
      await AsyncStorage.setItem('dayTimeConfig', JSON.stringify(config));
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const applyTemplate = (template) => {
    const newMajorBlocks = template.majorBlocks;
    const newTimeBlocks = template.subBlocks.reduce((acc, subBlock) => {
      const parentIndex = acc.findIndex(parent => parent.id === subBlock.parentId);
      if (parentIndex !== -1) {
        if (!acc[parentIndex].children) acc[parentIndex].children = [];
        acc[parentIndex].children.push({
          id: `${subBlock.parentId}_${Date.now()}_${Math.random()}`,
          ...subBlock
        });
      }
      return acc;
    }, newMajorBlocks.map(major => ({ ...major, children: [] })));

    setMajorBlocks(newMajorBlocks);
    setTimeBlocks(newTimeBlocks);
    dayTimeManager.setMajorBlocks(newMajorBlocks);
    initializeAllSessions(newTimeBlocks);
    saveConfiguration(newMajorBlocks, newTimeBlocks);
    setShowMajorBlockSetup(false);
    setIsFirstTime(false);
  };

  const initializeAllSessions = (blocks) => {
    blocks.forEach(parentBlock => {
      if (parentBlock.children) {
        parentBlock.children.forEach(childBlock => {
          dayTimeManager.initializeSession(childBlock);
        });
      }
    });
  };

  // ============================================================================
  // ⏰ 增强的计时器逻辑
  // ============================================================================

  const startTimers = () => {
    // 主逻辑计时器 - 每分钟更新
    if (timerRef.current) BackgroundTimer.clearInterval(timerRef.current);
    timerRef.current = BackgroundTimer.setInterval(() => {
      if (isRunning && currentSessionId && !isPaused) {
        const currentRemainingTime = dayTimeManager.getCurrentRemainingTime(currentSessionId);
        if (currentRemainingTime <= 0) {
          finishCurrentSession();
        }
      }
    }, 60000);

    // 显示更新计时器 - 根据设置频率更新
    if (displayTimerRef.current) clearInterval(displayTimerRef.current);
    displayTimerRef.current = setInterval(() => {
      // 强制重新渲染以更新显示
      if (isRunning || isPaused) {
        // 触发重新渲染
        setCurrentSessionId(prev => prev); // 触发状态更新
      }
    }, appSettings.updateInterval * 1000);
  };

  const startSession = (block) => {
    const session = dayTimeManager.initializeSession(block);
    const startedSession = dayTimeManager.startSession(block.id);
    
    if (startedSession) {
      setCurrentSessionId(block.id);
      setIsRunning(true);
      setIsPaused(false);
      
      // 安排结束通知
      const endTime = Date.now() + (startedSession.remainingTime * 60000);
      notificationManager.scheduleBlockEnd(block.name, endTime, block.id);
      
      if (appSettings.vibrationEnabled) {
        notificationManager.vibrate('start');
      }
    }
  };

  const pauseCurrentSession = () => {
    if (currentSessionId && !isPaused) {
      setPauseDestinationSelection(true);
    }
  };

  const confirmPause = (destinationBlockId) => {
    if (currentSessionId) {
      const result = dayTimeManager.pauseSession(currentSessionId, destinationBlockId);
      if (result) {
        setIsPaused(true);
        setPauseDestinationSelection(false);
        
        notificationManager.cancelNotification(`block_end_${currentSessionId}`);
        
        Alert.alert(
          '会话已暂停',
          `${result.session.name} 已暂停\n工作了 ${result.activeTime} 分钟\n暂停时间将计入: ${result.targetBlock?.name}`
        );
        
        if (appSettings.vibrationEnabled) {
          notificationManager.vibrate('pause');
        }
      }
    }
  };

  const resumeCurrentSession = () => {
    if (currentSessionId && isPaused) {
      const pauseDuration = dayTimeManager.endPauseTime(currentSessionId);
      const session = dayTimeManager.startSession(currentSessionId);
      
      if (session) {
        setIsPaused(false);
        
        // 重新安排结束通知
        const endTime = Date.now() + (session.remainingTime * 60000);
        notificationManager.scheduleBlockEnd(session.name, endTime, session.id);
        
        Alert.alert(
          '会话已恢复',
          `暂停了 ${pauseDuration} 分钟\n已计入 ${dayTimeManager.pauseDestinationBlock?.name}`
        );
        
        if (appSettings.vibrationEnabled) {
          notificationManager.vibrate('start');
        }
      }
    }
  };

  const switchToSession = (newBlock) => {
    if (isPaused) {
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
      
      Alert.alert('会话切换成功', `已切换到 ${newBlock.name}`);
      
      if (appSettings.vibrationEnabled) {
        notificationManager.vibrate('switch');
      }
    }
  };

  const finishCurrentSession = () => {
    if (currentSessionId) {
      if (isPaused) {
        dayTimeManager.endPauseTime(currentSessionId);
      }
      
      const session = dayTimeManager.sessions.get(currentSessionId);
      notificationManager.cancelNotification(`block_end_${currentSessionId}`);
      
      setIsRunning(false);
      setCurrentSessionId(null);
      setIsPaused(false);
      
      if (appSettings.soundEnabled) {
        notificationManager.sendImmediateNotification(
          '🎉 时间块完成！',
          `${session?.name} 已完成`
        );
      }
      
      Alert.alert(
        '🎉 时间块完成！',
        `${session?.name} 已完成\n工作时间：${session?.totalUsedTime} 分钟\n暂停时间：${session?.totalPauseTime} 分钟`
      );
      
      if (appSettings.vibrationEnabled) {
        notificationManager.vibrate('complete');
      }
    }
  };

  // ============================================================================
  // 🎨 时间块管理增强
  // ============================================================================

  const addChildBlock = (parentId) => {
    const newChild = {
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

  const deleteTimeBlock = (blockId, parentId) => {
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
              if (block.id === parentId) {
                const deletedChild = block.children.find(child => child.id === blockId);
                deletedDuration = deletedChild ? deletedChild.duration : 0;
                
                const newChildren = block.children.filter(child => child.id !== blockId);
                
                // 如果启用自动重分配且还有其他子项目
                if (appSettings.autoRedistribute && newChildren.length > 0 && deletedDuration > 0) {
                  const totalCurrentTime = newChildren.reduce((sum, child) => sum + child.duration, 0);
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

  const createTempBlock = () => {
    if (!newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    const tempBlock = {
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

  const resetTimeBlock = (blockId) => {
    dayTimeManager.resetSession(blockId);
    Alert.alert('重置完成', '时间块已重置到初始状态');
  };

  const toggleParentBlockCollapse = (parentId) => {
    const currentState = dayTimeManager.getCollapseState(parentId);
    dayTimeManager.setCollapseState(parentId, !currentState);
    // 触发重新渲染
    setTimeBlocks([...timeBlocks]);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setEditingBlock(null);
    setNewBlockName('');
    setNewBlockIcon('⭐');
    setNewBlockColor('#667eea');
    setNewBlockDuration(60);
  };

  // ============================================================================
  // 🎨 工具函数
  // ============================================================================

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const formatTimeWithSeconds = (minutes, seconds = 0) => {
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

  const getCurrentDisplayTime = () => {
    if (!currentSessionId) return '00:00';
    
    if (isPaused) {
      const pauseTime = dayTimeManager.getCurrentPauseTime(currentSessionId);
      return formatTimeWithSeconds(pauseTime);
    }
    
    if (appSettings.countDirection === 'down') {
      const remaining = dayTimeManager.getCurrentRemainingTime(currentSessionId);
      return formatTimeWithSeconds(remaining);
    } else {
      const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
      return formatTimeWithSeconds(elapsed);
    }
  };

  const getCurrentSessionDisplayName = () => {
    if (!currentSessionId) return '';
    
    const session = dayTimeManager.sessions.get(currentSessionId);
    if (!session) return '';
    
    if (isPaused) {
      return `${session.name} - 已暂停`;
    }
    
    return session.name;
  };

  const getProgressPercentage = () => {
    if (!currentSessionId) return 0;
    
    const session = dayTimeManager.sessions.get(currentSessionId);
    if (!session) return 0;
    
    const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
    return Math.min((elapsed / session.duration) * 100, 100);
  };

  const renderProgressBar = (current, total, color) => (
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
  // 🎨 渲染组件
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
                已用: {formatTime(dayTimeManager.getCurrentElapsedTime(currentSessionId))}
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
          const progress = (consumed / block.duration) * 100;

          return (
            <View key={block.id} style={[styles.majorBlockCard, { borderLeftColor: block.color }]}>
              <View style={styles.majorBlockHeader}>
                <Text style={styles.majorBlockName}>{block.name}</Text>
                <Text style={styles.majorBlockTime}>
                  {formatTime(remaining)} / {formatTime(block.duration)}
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

    const allBlocks = [];
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

  const renderActivityLogItem = ({ item }) => {
    const typeColors = {
      start: '#4CAF50',
      pause: '#FF9800',
      switch: '#2196F3',
      complete: '#9C27B0',
      pause_end: '#00BCD4',
      major_block_consume: '#FF5722',
    };

    const typeIcons = {
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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>暂停时间计入哪里？</Text>
            <Text style={styles.modalSubtitle}>选择暂停时间应该从哪个时间块中扣除</Text>
            
            {majorBlocks.map(block => (
              <TouchableOpacity
                key={block.id}
                onPress={() => confirmPause(block.id)}
                style={[styles.destinationOption, { borderColor: block.color }]}
              >
                <Text style={[styles.destinationName, { color: block.color }]}>
                  {block.name}
                </Text>
                <Text style={styles.destinationInfo}>
                  剩余: {formatTime(block.duration - (block.consumedTime || 0))}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              onPress={() => setPauseDestinationSelection(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 设置模态框 */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>应用设置</Text>
            
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
          </View>
        </View>
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
                onPress={() => addChildBlock(editingBlock.parentId)} 
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
    paddingTop: 40,
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