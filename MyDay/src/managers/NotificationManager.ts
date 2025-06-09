// src/managers/NotificationManager.ts
import { Platform, Vibration, Alert } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { VIBRATION_PATTERNS, NOTIFICATION_CONFIG, SOUND_OPTIONS } from '../constants';

export class NotificationManager {
  private soundContext: any = null; // 用于Web Audio API (如果需要)

  constructor() {
    this.configure();
  }

  /**
   * 配置通知
   */
  private configure(): void {
    PushNotification.configure({
      onRegister: (token) => console.log('通知令牌:', token),
      onNotification: (notification) => {
        console.log('收到通知:', notification);
        // 处理通知点击
        if (notification.userInteraction) {
          console.log('用户点击了通知');
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // 创建通知频道
    PushNotification.createChannel({
      channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
      channelName: NOTIFICATION_CONFIG.CHANNEL_NAME,
      channelDescription: NOTIFICATION_CONFIG.CHANNEL_DESCRIPTION,
      playSound: true,
      soundName: "default",
      importance: 4,
      vibrate: true,
    });

    // 请求通知权限
    this.requestNotificationPermission();
  }

  /**
   * 请求通知权限
   */
  private async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const { PermissionsAndroid } = require('react-native');
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } catch (error) {
        console.warn('通知权限请求失败:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * 震动反馈 - 支持不同类型和强度
   */
  vibrate(type: string = 'start', pattern: string = 'medium'): void {
    try {
      const vibrationPattern = VIBRATION_PATTERNS[pattern as keyof typeof VIBRATION_PATTERNS]?.[type] || 
                             VIBRATION_PATTERNS.medium[type as keyof typeof VIBRATION_PATTERNS.medium];
      
      if (Platform.OS === 'android' && vibrationPattern) {
        Vibration.vibrate(vibrationPattern);
      } else {
        // iOS 或者没有找到模式时使用简单震动
        Vibration.vibrate(200);
      }
    } catch (error) {
      console.warn('震动执行失败:', error);
    }
  }

  /**
   * 播放系统提示音 - 修复声音播放
   */
  playSystemSound(type: string = 'start'): void {
    try {
      // 使用系统声音 - 这是最可靠的方式
      if (Platform.OS === 'android') {
        // Android - 播放短暂的通知声音
        PushNotification.localNotification({
          title: '',
          message: '',
          playSound: true,
          soundName: 'default',
          channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
          importance: 'default',
          ongoing: false,
          autoCancel: true,
          vibrate: false,
          smallIcon: 'ic_notification',
          bigText: '',
          subText: '',
          showWhen: false,
          ignoreInForeground: false,
          shortcutId: `sound_${type}_${Date.now()}`,
        });
      } else {
        // iOS - 使用简单震动作为声音反馈
        Vibration.vibrate([100]);
      }
    } catch (error) {
      console.warn('播放系统声音失败:', error);
      // fallback 到震动
      this.vibrate(type, 'light');
    }
  }

  /**
   * 播放声音 - 根据类型播放不同声音
   */
  playSound(soundType: string = 'chime', actionType: string = 'start'): void {
    try {
      const soundConfig = SOUND_OPTIONS[soundType as keyof typeof SOUND_OPTIONS];
      
      if (!soundConfig || soundConfig.name === '无声音') {
        return; // 无声音模式
      }

      // 根据动作类型调整音调或音效
      switch (actionType) {
        case 'start':
          this.playSystemSound('start');
          break;
        case 'pause':
          this.playSystemSound('pause');
          break;
        case 'complete':
          // 完成时播放两次以示庆祝
          this.playSystemSound('complete');
          setTimeout(() => this.playSystemSound('complete'), 300);
          break;
        case 'switch':
          this.playSystemSound('switch');
          break;
        default:
          this.playSystemSound('start');
      }
    } catch (error) {
      console.warn('播放声音失败:', error);
    }
  }

  /**
   * 播放声音预览 - 用于设置界面
   */
  previewSound(soundType: string): void {
    try {
      const soundConfig = SOUND_OPTIONS[soundType as keyof typeof SOUND_OPTIONS];
      
      if (!soundConfig || soundConfig.name === '无声音') {
        Alert.alert('预览', '这是无声音模式');
        return;
      }

      // 播放预览音效
      this.playSystemSound('start');
      
      // 可选：显示预览提示
      if (__DEV__) {
        console.log(`预览声音: ${soundConfig.name}`);
      }
    } catch (error) {
      console.warn('声音预览失败:', error);
      Alert.alert('错误', '声音预览失败');
    }
  }

  /**
   * 震动预览 - 用于设置界面
   */
  previewVibration(pattern: string, type: string = 'start'): void {
    try {
      this.vibrate(type, pattern);
      
      if (__DEV__) {
        console.log(`预览震动: ${pattern} - ${type}`);
      }
    } catch (error) {
      console.warn('震动预览失败:', error);
    }
  }

  /**
   * 设置反馈 - 切换设置时的反馈
   */
  settingFeedback(type: 'sound' | 'vibration', enabled: boolean): void {
    try {
      if (type === 'sound' && enabled) {
        this.playSound('chime', 'start');
      } else if (type === 'vibration' && enabled) {
        this.vibrate('start', 'medium');
      }
    } catch (error) {
      console.warn('设置反馈失败:', error);
    }
  }

  /**
   * 安排时间块结束通知
   */
  scheduleBlockEnd(blockName: string, endTime: number, blockId: string): string {
    const notificationId = `block_end_${blockId}`;
    
    try {
      PushNotification.localNotificationSchedule({
        id: notificationId,
        title: '⏰ 时间块结束',
        message: `${blockName} 时间到了！`,
        date: new Date(endTime),
        channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
        vibrate: true,
        vibration: 300,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        invokeApp: true,
        ongoing: false,
        autoCancel: true,
      });
    } catch (error) {
      console.warn('安排通知失败:', error);
    }

    return notificationId;
  }

  /**
   * 发送即时通知
   */
  sendImmediateNotification(title: string, message: string, options: {
    showNotification?: boolean;
    playSound?: boolean;
    vibrate?: boolean;
    soundType?: string;
  } = {}): void {
    const {
      showNotification = true,
      playSound = true,
      vibrate = true,
      soundType = 'chime'
    } = options;

    try {
      if (showNotification) {
        PushNotification.localNotification({
          title,
          message,
          channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
          vibrate: vibrate,
          vibration: 300,
          playSound: playSound,
          soundName: 'default',
          importance: 'default',
          ongoing: false,
          autoCancel: true,
          invokeApp: false,
        });
      } else {
        // 只播放声音和震动，不显示通知
        if (playSound) {
          this.playSound(soundType, 'complete');
        }
        if (vibrate) {
          this.vibrate('complete', 'medium');
        }
      }
    } catch (error) {
      console.warn('发送即时通知失败:', error);
    }
  }

  /**
   * 取消通知
   */
  cancelNotification(notificationId: string): void {
    try {
      PushNotification.cancelLocalNotifications({ id: notificationId });
    } catch (error) {
      console.warn('取消通知失败:', error);
    }
  }

  /**
   * 取消所有通知
   */
  cancelAllNotifications(): void {
    try {
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.warn('取消所有通知失败:', error);
    }
  }

  /**
   * 发送成功反馈
   */
  sendSuccessFeedback(soundType: string = 'success', vibrationPattern: string = 'medium'): void {
    this.playSound(soundType, 'complete');
    this.vibrate('complete', vibrationPattern);
  }

  /**
   * 发送警告反馈
   */
  sendWarningFeedback(soundType: string = 'soft', vibrationPattern: string = 'medium'): void {
    this.playSound(soundType, 'pause');
    this.vibrate('pause', vibrationPattern);
  }

  /**
   * 发送操作反馈
   */
  sendActionFeedback(action: string, soundType: string = 'chime', vibrationPattern: string = 'medium'): void {
    this.playSound(soundType, action);
    this.vibrate(action, vibrationPattern);
  }

  /**
   * 综合反馈 - 根据设置播放声音和震动
   */
  provideFeedback(options: {
    action: 'start' | 'pause' | 'complete' | 'switch';
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    soundType?: string;
    vibrationPattern?: string;
  }): void {
    const {
      action,
      soundEnabled,
      vibrationEnabled,
      soundType = 'chime',
      vibrationPattern = 'medium'
    } = options;

    try {
      if (soundEnabled) {
        this.playSound(soundType, action);
      }
      
      if (vibrationEnabled) {
        this.vibrate(action, vibrationPattern);
      }
    } catch (error) {
      console.warn('提供反馈失败:', error);
    }
  }

  /**
   * 检查通知权限状态
   */
  async checkNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const { PermissionsAndroid } = require('react-native');
        if (Platform.Version >= 33) {
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return result;
        }
        return true;
      } catch (error) {
        console.warn('检查通知权限失败:', error);
        return false;
      }
    }
    return true; // iOS 默认假设有权限
  }

  /**
   * 获取挂起的通知
   */
  getPendingNotifications(): Promise<any[]> {
    return new Promise((resolve) => {
      try {
        PushNotification.getScheduledLocalNotifications((notifications) => {
          resolve(notifications);
        });
      } catch (error) {
        console.warn('获取挂起通知失败:', error);
        resolve([]);
      }
    });
  }
}