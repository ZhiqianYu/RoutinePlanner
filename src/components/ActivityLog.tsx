// src/components/ActivityLog.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { ActivityLog as ActivityLogType } from '../types';
import { ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_ICONS } from '../constants';
import { styles } from '../styles';

interface ActivityLogProps {
  visible: boolean;
  logs: ActivityLogType[];
  onClose: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  visible,
  logs,
  onClose,
}) => {
  const renderLogItem = ({ item }: { item: ActivityLogType }) => (
    <View style={styles.activityLogItem}>
      <View style={[
        styles.activityIcon, 
        { backgroundColor: ACTIVITY_TYPE_COLORS[item.type] || '#666' }
      ]}>
        <Text style={styles.activityIconText}>
          {ACTIVITY_TYPE_ICONS[item.type] || '📝'}
        </Text>
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

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>24小时活动记录</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLogItem}
          style={styles.activityLogList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};