// src/components/TimeBlockSelector.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TimeBlock } from '../types';
import { styles } from '../styles';
import { formatTime } from '../utils';

interface TimeBlockWithStatus extends TimeBlock {
  remainingTime: number;
  isActive: boolean;
}

interface TimeBlockSelectorProps {
  blocks: TimeBlockWithStatus[];
  currentSessionId: string | null;
  isPaused: boolean;
  onBlockPress: (block: TimeBlock) => void;
  onCreateTempBlock: () => void;
}

export const TimeBlockSelector: React.FC<TimeBlockSelectorProps> = ({
  blocks,
  currentSessionId,
  isPaused,
  onBlockPress,
  onCreateTempBlock,
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>时间块切换</Text>
      <ScrollView horizontal style={styles.blockSelector} showsHorizontalScrollIndicator={false}>
        {blocks.map(block => (
          <TouchableOpacity
            key={block.id}
            onPress={() => onBlockPress(block)}
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
          onPress={onCreateTempBlock}
          style={styles.addTempButton}
        >
          <Text style={styles.addTempButtonText}>⚡</Text>
          <Text style={styles.addTempButtonLabel}>临时块</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};