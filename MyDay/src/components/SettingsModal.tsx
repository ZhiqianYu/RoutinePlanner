// src/components/SettingsModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Switch } from 'react-native';
import { AppSettings, TimeBlock } from '../types';
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
  const renderSettingButtons = (
    currentValue: any,
    options: Array<{ value: any; label: string }>,
    onChange: (value: any) => void
  ) => (
    <View style={styles.settingButtons}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value?.toString() || 'null'}
          style={[
            styles.settingButton,
            currentValue === option.value && styles.settingButtonActive
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text style={styles.settingButtonText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
            <Text style={styles.settingLabel}>主题模式</Text>
            {renderSettingButtons(
              settings.theme,
              [
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
                { value: 'auto', label: '自动' }
              ],
              (value) => onSettingChange('theme', value)
            )}
          </View>

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
              (value) => onSettingChange('vibrationPattern', value)
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
              onValueChange={(value) => onSettingChange('showSeconds', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>自动折叠</Text>
            <Switch
              value={settings.autoCollapse}
              onValueChange={(value) => onSettingChange('autoCollapse', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>显示24小时分配</Text>
            <Switch
              value={settings.showMajorBlocks}
              onValueChange={(value) => onSettingChange('showMajorBlocks', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>焦点模式</Text>
            <Switch
              value={settings.focusMode}
              onValueChange={(value) => onSettingChange('focusMode', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>声音提醒</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => onSettingChange('soundEnabled', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>震动提醒</Text>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => onSettingChange('vibrationEnabled', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>删除后重分配时间</Text>
            <Switch
              value={settings.autoRedistribute}
              onValueChange={(value) => onSettingChange('autoRedistribute', value)}
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