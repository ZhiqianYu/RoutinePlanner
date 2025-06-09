// src/components/FocusMode.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Session, AppSettings } from '../types';

interface FocusModeProps {
  visible: boolean;
  session: Session | null;
  sessionDisplayName: string;
  currentDisplayTime: string;
  progressPercentage: number;
  isPaused: boolean;
  isActive: boolean;
  appSettings: AppSettings;
  getCurrentElapsedMinutes: () => number;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  visible,
  session,
  sessionDisplayName,
  currentDisplayTime,
  progressPercentage,
  isPaused,
  isActive,
  appSettings,
  getCurrentElapsedMinutes,
  onPause,
  onResume,
  onExit,
}) => {
  if (!visible || !session) return null;

  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  return (
    <View style={styles.focusModeContainer}>
      {/* 退出按钮 */}
      <TouchableOpacity style={styles.exitButton} onPress={onExit}>
        <Text style={styles.exitButtonText}>✕</Text>
      </TouchableOpacity>

      {/* 主显示区域 */}
      <View style={styles.focusContent}>
        <Text style={styles.focusSessionIcon}>{session.icon}</Text>
        <Text style={styles.focusSessionName}>{sessionDisplayName}</Text>
        <Text style={[
          styles.focusTime,
          isLandscape && styles.focusTimeLandscape
        ]}>
          {currentDisplayTime}
        </Text>
        
        {!isPaused && isActive && (
          <Text style={styles.focusElapsed}>
            已用: {Math.floor(getCurrentElapsedMinutes())} 分钟
          </Text>
        )}

        {/* 进度条 */}
        {!isPaused && isActive && (
          <View style={styles.focusProgressContainer}>
            <View style={styles.focusProgressTrack}>
              <View 
                style={[
                  styles.focusProgressFill,
                  { 
                    width: `${progressPercentage}%`,
                    backgroundColor: session.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.focusProgressText}>{Math.round(progressPercentage)}%</Text>
          </View>
        )}

        {/* 控制按钮 */}
        <View style={styles.focusControls}>
          {!isPaused ? (
            <TouchableOpacity onPress={onPause} style={styles.focusControlButton}>
              <Text style={styles.focusControlButtonText}>⏸️ 暂停</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={onResume} style={styles.focusControlButton}>
              <Text style={styles.focusControlButtonText}>▶️ 继续</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  focusModeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2001,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  focusContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 40,
  },
  focusSessionIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  focusSessionName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  focusTime: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  focusTimeLandscape: {
    fontSize: 96,
  },
  focusElapsed: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  focusProgressContainer: {
    width: '80%',
    alignItems: 'center',
    marginBottom: 40,
  },
  focusProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 10,
  },
  focusProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  focusProgressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  focusControls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  focusControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginHorizontal: 10,
  },
  focusControlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});