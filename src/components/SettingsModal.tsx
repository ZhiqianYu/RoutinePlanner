// src/components/SettingsModal.tsx
import React, { useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Switch } from 'react-native';
import { AppSettings, TimeBlock } from '../types';
import { NotificationManager } from '../managers';
import { SOUND_TYPES, SOUND_CATEGORIES, VIBRATION_CATEGORIES } from '../constants';
import { styles } from '../styles';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  majorBlocks: TimeBlock[];
  onClose: () => void;
  onSettingChange: (key: keyof AppSettings, value: any) => void;
  onShowActivityLog: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  majorBlocks,
  onClose,
  onSettingChange,
  onShowActivityLog,
}) => {
  const notificationManager = useRef(new NotificationManager()).current;

  const renderSettingButtons = (
    currentValue: any,
    options: Array<{ value: any; label: string }>,
    onChange: (value: any) => void,
    onPreview?: (value: any) => void
  ) => (
    <View style={styles.settingButtons}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value?.toString() || 'null'}
          style={[
            styles.settingButton,
            currentValue === option.value && styles.settingButtonActive
          ]}
          onPress={() => {
            onChange(option.value);
            onPreview?.(option.value);
          }}
        >
          <Text style={styles.settingButtonText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleVibrationPatternChange = (pattern: string) => {
    onSettingChange('vibrationPattern', pattern);
    // 预览震动效果
    notificationManager.vibrate('start', pattern);
  };

  const handleSoundTypeChange = (soundType: string) => {
    onSettingChange('soundType', soundType);
    // 预览声音效果
    notificationManager.playSound(soundType);
  };

  const handleSwitchChange = (key: keyof AppSettings, value: boolean) => {
    onSettingChange(key, value);
    
    // 根据开关类型提供反馈
    if (key === 'soundEnabled') {
      if (value && settings.soundEnabled !== value) {
        notificationManager.playSound(settings.soundType);
      }
    } else if (key === 'vibrationEnabled') {
      if (value && settings.vibrationEnabled !== value) {
        notificationManager.vibrate('start', settings.vibrationPattern);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.modalContent}
        >
          <Text style={styles.modalTitle}>应用设置</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>计时方向</Text>
            {renderSettingButtons(
              settings.countDirection,
              [
                { value: 'down', label: '倒计时' },
                { value: 'up', label: '正计时' }
              ],
              (value) => onSettingChange('countDirection', value)
            )}
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>震动强度</Text>
            {renderSettingButtons(
              settings.vibrationPattern,
              [
                { value: 'light', label: '轻' },
                { value: 'medium', label: '中' },
                { value: 'strong', label: '强' }
              ],
              (value) => onSettingChange('vibrationPattern', value),
              handleVibrationPatternChange
            )}
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>声音类型</Text>
            {renderSettingButtons(
              settings.soundType,
              Object.entries(SOUND_TYPES).map(([key, value]) => ({
                value: key,
                label: value.name
              })),
              handleSoundTypeChange
            )}
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>默认暂停目标</Text>
            {renderSettingButtons(
              settings.defaultPauseDestination,
              [
                ...majorBlocks.map(block => ({ value: block.id, label: block.name })),
                { value: null, label: '每次选择' }
              ],
              (value) => onSettingChange('defaultPauseDestination', value)
            )}
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>显示秒数</Text>
            <Switch
              value={settings.showSeconds}
              onValueChange={(value) => handleSwitchChange('showSeconds', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>自动折叠</Text>
            <Switch
              value={settings.autoCollapse}
              onValueChange={(value) => handleSwitchChange('autoCollapse', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>显示24小时分配</Text>
            <Switch
              value={settings.showMajorBlocks}
              onValueChange={(value) => handleSwitchChange('showMajorBlocks', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>声音提醒</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => handleSwitchChange('soundEnabled', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>震动提醒</Text>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => handleSwitchChange('vibrationEnabled', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>删除后重分配时间</Text>
            <Switch
              value={settings.autoRedistribute}
              onValueChange={(value) => handleSwitchChange('autoRedistribute', value)}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={onShowActivityLog}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>活动日志</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>完成</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};