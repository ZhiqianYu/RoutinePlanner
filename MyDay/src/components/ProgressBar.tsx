// src/components/ProgressBar.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface ProgressBarProps {
  current: number;
  total: number;
  color: string;
  progress?: number; // 可选的预计算进度值
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  color,
  progress,
  showPercentage = true,
}) => {
  const calculatedProgress = progress ?? Math.min((current / total) * 100, 100);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${calculatedProgress}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      {showPercentage && (
        <Text style={styles.progressText}>
          {Math.round(calculatedProgress)}%
        </Text>
      )}
    </View>
  );
};