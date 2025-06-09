// src/components/CurrentSession.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppSettings, Session } from '../types';
import { styles } from '../styles';
import { formatTime } from '../utils';

interface CurrentSessionProps {
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
}

export const CurrentSession: React.FC<CurrentSessionProps> = ({
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
}) => {
  if (!session) return null;

  return (
    <View style={[
      styles.currentSessionCard,
      appSettings.focusMode && styles.focusMode
    ]}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionIcon}>{session.icon}</Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionName}>{sessionDisplayName}</Text>
          <Text style={styles.sessionTime}>{currentDisplayTime}</Text>
          {!isPaused && isActive && (
            <Text style={styles.sessionElapsed}>
              已用: {formatTime(getCurrentElapsedMinutes())}
            </Text>
          )}
        </View>
        
        {!isPaused ? (
          <TouchableOpacity onPress={onPause} style={styles.pauseButton}>
            <Text style={styles.pauseButtonText}>⏸️</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onResume} style={styles.resumeButton}>
            <Text style={styles.resumeButtonText}>▶️</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {!isPaused && isActive && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: session.color 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
        </View>
      )}
    </View>
  );
};