// src/components/TimeBlocksList.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { TimeBlock, AppSettings, Session } from '../types';
import { styles } from '../styles';
import { formatTime } from '../utils';

interface TimeBlocksListProps {
  timeBlocks: TimeBlock[];
  currentSessionId: string | null;
  isPaused: boolean;
  appSettings: AppSettings;
  getSession: (blockId: string) => Session | undefined;
  getCollapseState: (parentId: string) => boolean;
  onToggleCollapse: (parentId: string) => void;
  onAddChild: (parentId: string) => void;
  onDeleteBlock: (blockId: string, parentId: string) => void;
  onBlockPress: (block: TimeBlock) => void;
  onBlockLongPress: (block: TimeBlock) => void;
  onEditChildBlock?: (block: TimeBlock, parentId: string) => void;
}

export const TimeBlocksList: React.FC<TimeBlocksListProps> = ({
  timeBlocks,
  currentSessionId,
  isPaused,
  appSettings,
  getSession,
  getCollapseState,
  onToggleCollapse,
  onAddChild,
  onDeleteBlock,
  onBlockPress,
  onBlockLongPress,
  onEditChildBlock,
}) => {
  return (
    <View>
      {timeBlocks.map(parentBlock => {
        const isCollapsed = getCollapseState(parentBlock.id);

        return (
          <View key={parentBlock.id} style={[
            styles.parentBlock,
            isCollapsed && styles.collapsedParentBlock
          ]}>
            <TouchableOpacity
              onPress={() => onToggleCollapse(parentBlock.id)}
              style={[styles.parentBlockHeader, { backgroundColor: parentBlock.color }]}
            >
              <View style={styles.parentBlockTitle}>
                <Text style={styles.parentIcon}>{parentBlock.icon || '📁'}</Text>
                <Text style={styles.parentName}>{parentBlock.name}</Text>
              </View>
              <View style={styles.parentBlockActions}>
                <Text style={[
                  styles.collapseIndicator, 
                  isCollapsed && styles.collapseIndicatorCollapsed
                ]}>
                  ▼
                </Text>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onAddChild(parentBlock.id);
                  }}
                  style={styles.addChildButton}
                >
                  <Text style={styles.addChildButtonText}>+ 添加</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {!isCollapsed && (
              <View style={styles.childrenContainer}>
                {parentBlock.children?.map(childBlock => {
                  const session = getSession(childBlock.id);
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
                        onPress={() => onDeleteBlock(childBlock.id, parentBlock.id)}
                      >
                        <Text style={styles.deleteButtonText}>×</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.childContent}
                        onPress={() => onBlockPress(childBlock)}
                        onLongPress={() => {
                          Alert.alert(
                            childBlock.name,
                            '选择操作',
                            [
                              { 
                                text: '编辑', 
                                onPress: () => onEditChildBlock?.(childBlock, parentBlock.id) 
                              },
                              { 
                                text: '重置', 
                                onPress: () => onBlockLongPress(childBlock) 
                              },
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