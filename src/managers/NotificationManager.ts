// src/managers/NotificationManager.ts
import { Platform, Vibration } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { VIBRATION_PATTERNS, NOTIFICATION_CONFIG } from '../constants';

export class NotificationManager {
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
        
        // 修复：安全处理 notificationData
        try {
          if (notification.data && typeof notification.data === 'string') {
            notification.data = JSON.parse(notification.data);
          }
        } catch (error) {
          console.warn('解析通知数据失败:', error);
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

    PushNotification.createChannel({
      channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
      channelName: NOTIFICATION_CONFIG.CHANNEL_NAME,
      channelDescription: NOTIFICATION_CONFIG.CHANNEL_DESCRIPTION,
      playSound: true,
      soundName: "default",
      importance: 4,
      vibrate: true,
    });
  }

  /**
   * 震动反馈
   */
  vibrate(type: string = 'start', pattern: string = 'medium'): void {
    const vibrationPattern = VIBRATION_PATTERNS[pattern as keyof typeof VIBRATION_PATTERNS]?.[type] || 
                           VIBRATION_PATTERNS.medium[type as keyof typeof VIBRATION_PATTERNS.medium];
    
    if (Platform.OS === 'android' && vibrationPattern) {
      Vibration.vibrate(vibrationPattern);
    } else {
      Vibration.vibrate();
    }
  }

  /**
   * 播放声音
   */
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

  /**
   * 安排时间块结束通知
   */
  scheduleBlockEnd(blockName: string, endTime: number, blockId: string): string {
    const notificationId = `block_end_${blockId}`;
    
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
    });

    return notificationId;
  }

  /**
   * 发送即时通知
   */
  sendImmediateNotification(title: string, message: string, showNotification: boolean = true): void {
    if (showNotification) {
      PushNotification.localNotification({
        title,
        message,
        channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
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
        channelId: NOTIFICATION_CONFIG.CHANNEL_ID,
        vibrate: false,
        playSound: true,
        soundName: 'default',
        ongoing: false,
        autoCancel: true,
      });
    }
  }

  /**
   * 取消通知
   */
  cancelNotification(notificationId: string): void {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }

  /**
   * 发送成功反馈
   */
  sendSuccessFeedback(vibrationPattern: string = 'medium'): void {
    this.vibrate('complete', vibrationPattern);
  }

  /**
   * 发送警告反馈
   */
  sendWarningFeedback(vibrationPattern: string = 'medium'): void {
    this.vibrate('pause', vibrationPattern);
  }

  /**
   * 发送操作反馈
   */
  sendActionFeedback(action: string, vibrationPattern: string = 'medium'): void {
    this.vibrate(action, vibrationPattern);
  }
}