// src/components/MajorBlocks.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { TimeBlock } from '../types';
import { styles } from '../styles';
import { formatTime, calculateProgress } from '../utils';
import { ProgressBar } from './ProgressBar';

interface MajorBlocksProps {
  blocks: TimeBlock[];
  visible: boolean;
}

export const MajorBlocks: React.FC<MajorBlocksProps> = ({ blocks, visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.majorBlocksContainer}>
      <Text style={styles.sectionTitle}>24小时时间分配</Text>
      {blocks.map(block => {
        const consumed = block.consumedTime || 0;
        const progress = calculateProgress(consumed, block.duration);

        return (
          <View key={block.id} style={[styles.majorBlockCard, { borderLeftColor: block.color }]}>
            <View style={styles.majorBlockHeader}>
              <Text style={styles.majorBlockName}>{block.name}</Text>
              <Text style={styles.majorBlockTime}>
                {formatTime(consumed)} / {formatTime(block.duration)}
              </Text>
            </View>
            <ProgressBar
              current={consumed}
              total={block.duration}
              color={block.color}
              progress={progress}
            />
          </View>
        );
      })}
    </View>
  );
};