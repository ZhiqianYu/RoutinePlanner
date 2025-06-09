// src/hooks/useTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { TimeBlock, AppSettings } from '../types';
import { DayTimeManager, NotificationManager } from '../managers';
import { formatTimeWithSeconds } from '../utils';

interface UseTimerProps {
  dayTimeManager: DayTimeManager;
  appSettings: AppSettings;
  onSessionComplete?: (sessionId: string) => void;
}

export const useTimer = ({ dayTimeManager, appSettings, onSessionComplete }: UseTimerProps) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [, setForceUpdate] = useState({});
  
  const timerRef = useRef<number | null>(null);
  const displayTimerRef = useRef<number | null>(null);
  const notificationManager = useRef(new NotificationManager()).current;

  const forceUpdate = useCallback(() => setForceUpdate({}), []);

  /**
   * 清理定时器
   */
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

  /**
   * 启动定时器
   */
  const startTimers = useCallback(() => {
    cleanupTimers();
    
    // 主逻辑计时器 - 每分钟更新
    timerRef.current = BackgroundTimer.setInterval(() => {
      if (isRunning && currentSessionId && !isPaused) {
        const currentRemainingTime = dayTimeManager.getCurrentRemainingTime(currentSessionId);
        if (currentRemainingTime.minutes <= 0 && currentRemainingTime.seconds <= 0) {
          finishCurrentSession();
        }
      }
    }, 60000);

    // 显示更新计时器 - 每秒更新
    displayTimerRef.current = setInterval(() => {
      if (isRunning || isPaused) {
        setCurrentSeconds(prev => prev + 1);
        forceUpdate();
      }
    }, 1000);
  }, [isRunning, currentSessionId, isPaused, cleanupTimers, forceUpdate, dayTimeManager]);

  /**
   * 开始会话
   */
  const startSession = useCallback((block: TimeBlock) => {
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
  }, [dayTimeManager, appSettings, notificationManager]);

  /**
   * 暂停当前会话
   */
  const pauseCurrentSession = useCallback((destinationBlockId?: string) => {
    if (currentSessionId && !isPaused) {
      const result = dayTimeManager.pauseSession(currentSessionId, destinationBlockId);
      if (result) {
        setIsPaused(true);
        
        notificationManager.cancelNotification(`block_end_${currentSessionId}`);
        
        // 添加声音和震动反馈
        if (appSettings.soundEnabled) {
          notificationManager.playSound(appSettings.soundType);
        }
        if (appSettings.vibrationEnabled) {
          notificationManager.vibrate('pause', appSettings.vibrationPattern);
        }
        
        return result;
      }
    }
    return null;
  }, [currentSessionId, isPaused, dayTimeManager, appSettings, notificationManager]);

  /**
   * 恢复当前会话
   */
  const resumeCurrentSession = useCallback(() => {
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
        
        return pauseDuration;
      }
    }
    return 0;
  }, [currentSessionId, isPaused, dayTimeManager, appSettings, notificationManager]);

  /**
   * 切换到新会话
   */
  const switchToSession = useCallback((newBlock: TimeBlock, pauseDestination?: string) => {
    if (isPaused && currentSessionId) {
      dayTimeManager.endPauseTime(currentSessionId);
    }
    
    if (currentSessionId) {
      notificationManager.cancelNotification(`block_end_${currentSessionId}`);
    }
    
    const result = dayTimeManager.switchToSession(currentSessionId, newBlock.id, pauseDestination);
    
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
      
      return result;
    }
    return null;
  }, [currentSessionId, isPaused, dayTimeManager, appSettings, notificationManager]);

  /**
   * 完成当前会话
   */
  const finishCurrentSession = useCallback(() => {
    if (currentSessionId) {
      if (isPaused) {
        dayTimeManager.endPauseTime(currentSessionId);
      }
      
      const session = dayTimeManager.getSession(currentSessionId);
      notificationManager.cancelNotification(`block_end_${currentSessionId}`);
      
      const finishedSessionId = currentSessionId;
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
      
      // 显示完成提醒
      Alert.alert(
        '🎉 时间块完成！',
        `${session?.name || '未知任务'} 已完成\n工作时间：${session?.totalUsedTime || 0} 分钟\n暂停时间：${session?.totalPauseTime || 0} 分钟`
      );
      
      // 触发回调
      onSessionComplete?.(finishedSessionId);
    }
  }, [currentSessionId, isPaused, dayTimeManager, appSettings, notificationManager, onSessionComplete]);

  /**
   * 停止当前会话
   */
  const stopCurrentSession = useCallback(() => {
    if (currentSessionId) {
      if (isRunning) {
        pauseCurrentSession();
      }
      
      notificationManager.cancelNotification(`block_end_${currentSessionId}`);
      setIsRunning(false);
      setCurrentSessionId(null);
      setIsPaused(false);
    }
  }, [currentSessionId, isRunning, pauseCurrentSession, notificationManager]);

  /**
   * 重置时间块
   */
  const resetTimeBlock = useCallback((blockId: string) => {
    dayTimeManager.resetSession(blockId);
    forceUpdate();
  }, [dayTimeManager, forceUpdate]);

  /**
   * 获取当前显示时间
   */
  const getCurrentDisplayTime = useCallback((): string => {
    if (!currentSessionId) return '00:00';
    
    if (isPaused) {
      const pauseTime = dayTimeManager.getCurrentPauseTime(currentSessionId);
      return formatTimeWithSeconds(pauseTime.minutes, pauseTime.seconds, appSettings.showSeconds);
    }
    
    if (appSettings.countDirection === 'down') {
      const remaining = dayTimeManager.getCurrentRemainingTime(currentSessionId);
      return formatTimeWithSeconds(remaining.minutes, remaining.seconds, appSettings.showSeconds);
    } else {
      const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
      return formatTimeWithSeconds(elapsed.minutes, elapsed.seconds, appSettings.showSeconds);
    }
  }, [currentSessionId, isPaused, dayTimeManager, appSettings]);

  /**
   * 获取当前会话显示名称
   */
  const getCurrentSessionDisplayName = useCallback((): string => {
    if (!currentSessionId) return '';
    
    const session = dayTimeManager.getSession(currentSessionId);
    if (!session) return '';
    
    if (isPaused) {
      return `${session.name} - 已暂停`;
    }
    
    return session.name;
  }, [currentSessionId, isPaused, dayTimeManager]);

  /**
   * 获取进度百分比
   */
  const getProgressPercentage = useCallback((): number => {
    if (!currentSessionId) return 0;
    
    const session = dayTimeManager.getSession(currentSessionId);
    if (!session) return 0;
    
    const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
    const totalElapsedMinutes = elapsed.minutes + elapsed.seconds / 60;
    return Math.min((totalElapsedMinutes / session.duration) * 100, 100);
  }, [currentSessionId, dayTimeManager]);

  // 启动定时器
  useEffect(() => {
    startTimers();
  }, [startTimers]);

  // 清理定时器
  useEffect(() => {
    return cleanupTimers;
  }, [cleanupTimers]);

  return {
    // 状态
    currentSessionId,
    isRunning,
    isPaused,
    currentSeconds,
    
    // 操作方法
    startSession,
    pauseCurrentSession,
    resumeCurrentSession,
    switchToSession,
    finishCurrentSession,
    stopCurrentSession,
    resetTimeBlock,
    
    // 获取信息方法
    getCurrentDisplayTime,
    getCurrentSessionDisplayName,
    getProgressPercentage,
    
    // 工具方法
    forceUpdate,
  };
};