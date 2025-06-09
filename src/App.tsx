// App.tsx - 完整修正版本
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  FlatList,
  Switch,
} from 'react-native';

// 导入模块化的代码
import { TimeBlock, DayTemplate, ActivityLog } from './types';
import { DAY_TEMPLATES, COLOR_OPTIONS, EMOJI_OPTIONS, ACTIVITY_TYPE_COLORS, ACTIVITY_TYPE_ICONS } from './constants';
import { formatTime, formatTimeWithSeconds, calculateProgress } from './utils';
import { useAppSettings, useTimeBlocks, useTimer, useOrientation } from './hooks';
import { 
  CurrentSession, 
  TimeBlockSelector, 
  MajorBlocks, 
  SettingsModal, 
  TimeBlocksList, 
  ActivityLog as ActivityLogComponent,
  FocusButton,
  FocusMode,
} from './components';
import { styles } from './styles';

const App: React.FC = () => {
  // 使用自定义hooks
  const { settings: appSettings, saveSettings } = useAppSettings();
  const { 
    majorBlocks, 
    timeBlocks, 
    isFirstTime, 
    dayTimeManager, 
    applyTemplate, 
    addChildBlock, 
    deleteTimeBlock, 
    createTempBlock,
    updateTimeBlock
  } = useTimeBlocks();
  
  const {
    currentSessionId,
    isRunning,
    isPaused,
    startSession,
    pauseCurrentSession,
    resumeCurrentSession,
    switchToSession,
    resetTimeBlock,
    getCurrentDisplayTime,
    getCurrentSessionDisplayName,
    getProgressPercentage,
  } = useTimer({ 
    dayTimeManager, 
    appSettings,
    onSessionComplete: (sessionId) => {
      console.log('会话完成:', sessionId);
    }
  });

  // 屏幕方向检测
  const isLandscape = useOrientation();

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<{ parentId?: string; block?: TimeBlock } | null>(null);
  const [pauseDestinationSelection, setPauseDestinationSelection] = useState(false);
  
  // 显示状态
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showDailyStats, setShowDailyStats] = useState(false);
  const [showMajorBlockSetup, setShowMajorBlockSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 专注模式状态
  const [focusMode, setFocusMode] = useState(false);

  // 新建/编辑时间块状态
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockIcon, setNewBlockIcon] = useState('⭐');
  const [newBlockColor, setNewBlockColor] = useState('#7C3AED');
  const [newBlockDuration, setNewBlockDuration] = useState(60);

  // 横屏时自动进入专注模式
  useEffect(() => {
    if (isLandscape && currentSessionId && !focusMode) {
      setFocusMode(true);
    } else if (!isLandscape && focusMode) {
      setFocusMode(false);
    }
  }, [isLandscape, currentSessionId, focusMode]);

  // 处理模板应用
  const handleApplyTemplate = useCallback(async (template: DayTemplate) => {
    try {
      await applyTemplate(template);
      setShowMajorBlockSetup(false);
    } catch (error) {
      Alert.alert('错误', '应用模板失败');
    }
  }, [applyTemplate]);

  // 处理暂停确认
  const handleConfirmPause = useCallback((destinationBlockId: string) => {
    const result = pauseCurrentSession(destinationBlockId);
    if (result) {
      setPauseDestinationSelection(false);
      
      Alert.alert(
        '会话已暂停',
        `${result.session.name} 已暂停\n工作了 ${result.activeTime} 分钟\n暂停时间将计入: ${result.targetBlock?.name || '未知'}`
      );
    }
  }, [pauseCurrentSession]);

  // 处理暂停操作
  const handlePauseCurrentSession = useCallback(() => {
    if (currentSessionId && !isPaused) {
      if (appSettings.defaultPauseDestination) {
        handleConfirmPause(appSettings.defaultPauseDestination);
      } else {
        setPauseDestinationSelection(true);
      }
    }
  }, [currentSessionId, isPaused, appSettings.defaultPauseDestination, handleConfirmPause]);

  // 处理时间块删除
  const handleDeleteTimeBlock = useCallback((blockId: string, parentId: string) => {
    Alert.alert(
      '确认删除',
      appSettings.autoRedistribute ? 
        '删除后时间将重新分配给其他项目，确定吗？' : 
        '确定要删除这个时间块吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const deletedDuration = await deleteTimeBlock(blockId, parentId, appSettings.autoRedistribute);
              if (appSettings.autoRedistribute && deletedDuration > 0) {
                Alert.alert('时间已重新分配', `已将 ${deletedDuration} 分钟重新分配给其他项目`);
              }
            } catch (error) {
              Alert.alert('错误', '删除时间块失败');
            }
          }
        }
      ]
    );
  }, [deleteTimeBlock, appSettings.autoRedistribute]);

  // 处理添加子时间块
  const handleAddChildBlock = useCallback(async (parentId: string) => {
    if (!newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    try {
      await addChildBlock(parentId, {
        name: newBlockName,
        icon: newBlockIcon,
        color: newBlockColor,
        duration: newBlockDuration,
      });
      closeModal();
    } catch (error) {
      Alert.alert('错误', '添加时间块失败');
    }
  }, [addChildBlock, newBlockName, newBlockIcon, newBlockColor, newBlockDuration]);

  // 处理编辑主要时间块
  const handleEditMajorBlock = useCallback(async () => {
    if (!editingBlock?.block || !newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    try {
      const success = dayTimeManager.updateMajorBlock(editingBlock.block.id, {
        name: newBlockName,
        icon: newBlockIcon,
        duration: newBlockDuration,
      });
      
      if (success) {
        closeModal();
        Alert.alert('修改成功', '主要时间块已更新');
      } else {
        Alert.alert('错误', '修改失败');
      }
    } catch (error) {
      Alert.alert('错误', '修改时间块失败');
    }
  }, [dayTimeManager, editingBlock, newBlockName, newBlockIcon, newBlockDuration]);

  // 处理编辑子时间块
  const handleEditChildBlock = useCallback(async () => {
    if (!editingBlock?.block || !newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    try {
      await updateTimeBlock(editingBlock.block.id, {
        name: newBlockName,
        icon: newBlockIcon,
        color: newBlockColor,
        duration: newBlockDuration,
      });
      closeModal();
      Alert.alert('修改成功', '时间块已更新');
    } catch (error) {
      Alert.alert('错误', '修改时间块失败');
    }
  }, [updateTimeBlock, editingBlock, newBlockName, newBlockIcon, newBlockColor, newBlockDuration]);

  // 处理创建临时时间块
  const handleCreateTempBlock = useCallback(async () => {
    if (!newBlockName.trim()) {
      Alert.alert('提示', '请输入时间块名称');
      return;
    }

    try {
      await createTempBlock({
        name: newBlockName,
        duration: newBlockDuration,
      });
      closeModal();
      Alert.alert('临时时间块已创建', `${newBlockName} (${newBlockDuration}分钟)`);
    } catch (error) {
      Alert.alert('错误', '创建临时时间块失败');
    }
  }, [createTempBlock, newBlockName, newBlockDuration]);

  // 关闭模态框
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setModalType(null);
    setEditingBlock(null);
    setNewBlockName('');
    setNewBlockIcon('⭐');
    setNewBlockColor('#7C3AED');
    setNewBlockDuration(60);
  }, []);

  // 切换父块折叠状态
  const toggleParentBlockCollapse = useCallback((parentId: string) => {
    const currentState = dayTimeManager.getCollapseState(parentId);
    dayTimeManager.setCollapseState(parentId, !currentState);
  }, [dayTimeManager]);

  // 处理大模块长按编辑
  const handleMajorBlockLongPress = useCallback((block: TimeBlock) => {
    setEditingBlock({ block });
    setNewBlockName(block.name);
    setNewBlockIcon(block.icon || '⭐');
    setNewBlockColor(block.color || '#7C3AED');
    setNewBlockDuration(block.duration);
    setModalType('editMajorBlock');
    setModalVisible(true);
  }, []);

  // 处理子时间块长按编辑
  const handleChildBlockEdit = useCallback((block: TimeBlock, parentId: string) => {
    setEditingBlock({ block, parentId });
    setNewBlockName(block.name);
    setNewBlockIcon(block.icon || '⭐');
    setNewBlockColor(block.color || '#7C3AED');
    setNewBlockDuration(block.duration);
    setModalType('editChildBlock');
    setModalVisible(true);
  }, []);

  // 渲染当前会话
  const renderCurrentSession = useCallback(() => {
    if (!currentSessionId) return null;

    const session = dayTimeManager.getSession(currentSessionId);
    if (!session) return null;

    return (
      <CurrentSession
        session={session}
        sessionDisplayName={getCurrentSessionDisplayName()}
        currentDisplayTime={getCurrentDisplayTime()}
        progressPercentage={getProgressPercentage()}
        isPaused={isPaused}
        isActive={isRunning}
        appSettings={appSettings}
        getCurrentElapsedMinutes={() => {
          const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId);
          return elapsed.minutes;
        }}
        onPause={handlePauseCurrentSession}
        onResume={resumeCurrentSession}
      />
    );
  }, [currentSessionId, dayTimeManager, getCurrentSessionDisplayName, getCurrentDisplayTime, getProgressPercentage, isPaused, isRunning, appSettings, handlePauseCurrentSession, resumeCurrentSession]);

  // 监听首次使用状态
  React.useEffect(() => {
    if (isFirstTime) {
      setShowMajorBlockSetup(true);
    }
  }, [isFirstTime]);

  // 如果是专注模式，显示专注界面
  if (focusMode) {
    const session = currentSessionId ? dayTimeManager.getSession(currentSessionId) : null;
    return (
      <FocusMode
        visible={focusMode}
        session={session}
        sessionDisplayName={getCurrentSessionDisplayName()}
        currentDisplayTime={getCurrentDisplayTime()}
        progressPercentage={getProgressPercentage()}
        isPaused={isPaused}
        isActive={isRunning}
        appSettings={appSettings}
        getCurrentElapsedMinutes={() => {
          const elapsed = dayTimeManager.getCurrentElapsedTime(currentSessionId || '');
          return elapsed.minutes;
        }}
        onPause={handlePauseCurrentSession}
        onResume={resumeCurrentSession}
        onExit={() => setFocusMode(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent={true}
        hidden={false}
      />
      
      {/* 顶部控制栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowDailyStats(true)} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>📊</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>身体感知时间管理</Text>
        
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* 当前会话显示 */}
      {renderCurrentSession()}

      <ScrollView style={styles.scrollView}>
        {/* 主要时间块状态 */}
        <MajorBlocks
          blocks={majorBlocks}
          visible={!isFirstTime && appSettings.showMajorBlocks}
          onLongPress={handleMajorBlockLongPress}
        />

        {/* 时间块选择器 */}
        {!isFirstTime && (
          <TimeBlockSelector
            blocks={(() => {
              const allBlocks: Array<TimeBlock & { remainingTime: number; isActive: boolean }> = [];
              timeBlocks.forEach(parentBlock => {
                if (parentBlock.children) {
                  parentBlock.children.forEach(child => {
                    const session = dayTimeManager.getSession(child.id);
                    if (session && session.remainingTime > 0) {
                      allBlocks.push({
                        ...child,
                        remainingTime: session.remainingTime,
                        isActive: session.isActive && !isPaused,
                      });
                    }
                  });
                }
              });
              return allBlocks;
            })()}
            currentSessionId={currentSessionId}
            isPaused={isPaused}
            onBlockPress={(block) => {
              if (currentSessionId === block.id) {
                if (isPaused) {
                  resumeCurrentSession();
                } else {
                  handlePauseCurrentSession();
                }
              } else {
                if (currentSessionId) {
                  switchToSession(block);
                } else {
                  startSession(block);
                }
              }
            }}
            onCreateTempBlock={() => {
              setModalType('tempBlock');
              setModalVisible(true);
            }}
          />
        )}

        {/* 时间块列表 */}
        {!isFirstTime && (
          <TimeBlocksList
            timeBlocks={timeBlocks}
            currentSessionId={currentSessionId}
            isPaused={isPaused}
            appSettings={appSettings}
            getSession={(blockId) => dayTimeManager.getSession(blockId)}
            getCollapseState={(parentId) => dayTimeManager.getCollapseState(parentId)}
            onToggleCollapse={toggleParentBlockCollapse}
            onAddChild={(parentId) => {
              setModalType('addChild');
              setEditingBlock({ parentId });
              setModalVisible(true);
            }}
            onDeleteBlock={handleDeleteTimeBlock}
            onBlockPress={(block) => {
              if (currentSessionId === block.id) {
                if (isPaused) {
                  resumeCurrentSession();
                } else {
                  handlePauseCurrentSession();
                }
              } else {
                if (currentSessionId) {
                  switchToSession(block);
                } else {
                  startSession(block);
                }
              }
            }}
            onBlockLongPress={(block) => {
              Alert.alert(
                block.name,
                '选择操作',
                [
                  { text: '重置', onPress: () => resetTimeBlock(block.id) },
                  { text: '取消', style: 'cancel' }
                ]
              );
            }}
            onEditChildBlock={handleChildBlockEdit}
          />
        )}
      </ScrollView>

      {/* 专注模式悬浮按钮 */}
      <FocusButton
        isVisible={!!currentSessionId && !isLandscape}
        onPress={() => setFocusMode(true)}
      />

      {/* 24小时模板设置模态框 */}
      <Modal visible={showMajorBlockSetup} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择24小时模板</Text>
          </View>
          <ScrollView style={styles.templateList}>
            {DAY_TEMPLATES.map((template, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleApplyTemplate(template)}
                style={styles.templateCard}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>
                  主要时间块: {template.majorBlocks.map(b => b.name).join(', ')}
                </Text>
                <Text style={styles.templateSubBlocks}>
                  包含 {template.subBlocks.length} 个子时间块
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 暂停目标选择模态框 */}
      <Modal visible={pauseDestinationSelection} animationType="slide" transparent>
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPauseDestinationSelection(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>暂停时间计入哪里？</Text>
            <Text style={styles.modalSubtitle}>选择暂停时间应该从哪个时间块中扣除</Text>
            
            {majorBlocks.map(block => (
              <TouchableOpacity
                key={block.id}
                onPress={() => handleConfirmPause(block.id)}
                onLongPress={() => {
                  saveSettings({ defaultPauseDestination: block.id });
                  Alert.alert('已设为默认', `今后暂停将默认计入: ${block.name}`);
                  handleConfirmPause(block.id);
                }}
                style={[styles.destinationOption, { borderColor: block.color }]}
              >
                <Text style={[styles.destinationName, { color: block.color }]}>
                  {block.name}
                  {appSettings.defaultPauseDestination === block.id && ' (默认)'}
                </Text>
                <Text style={styles.destinationInfo}>
                  剩余: {formatTime(block.duration - (block.consumedTime || 0))}
                </Text>
                <Text style={styles.destinationHint}>
                  长按设为默认选择
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              onPress={() => setPauseDestinationSelection(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 设置模态框 */}
      <SettingsModal
        visible={showSettings}
        settings={appSettings}
        majorBlocks={majorBlocks}
        onClose={() => setShowSettings(false)}
        onSettingChange={(key, value) => saveSettings({ [key]: value })}
        onShowActivityLog={() => setShowActivityLog(true)}
      />

      {/* 添加时间块模态框 */}
      <Modal visible={modalType === 'addChild' && modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>添加时间块</Text>
            
            <Text style={styles.inputLabel}>名称:</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockName}
              onChangeText={setNewBlockName}
              placeholder="输入时间块名称"
              placeholderTextColor="#888"
            />
            
            <Text style={styles.inputLabel}>图标:</Text>
            <ScrollView horizontal style={styles.emojiContainer}>
              {EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setNewBlockIcon(emoji)}
                  style={[
                    styles.emojiOption,
                    newBlockIcon === emoji && styles.selectedEmoji
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.inputLabel}>颜色:</Text>
            <View style={styles.colorContainer}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewBlockColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newBlockColor === color && styles.selectedColor
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.inputLabel}>时长 (分钟):</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockDuration.toString()}
              onChangeText={(text) => setNewBlockDuration(parseInt(text) || 0)}
              placeholder="输入时长"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => editingBlock?.parentId && handleAddChildBlock(editingBlock.parentId)} 
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑主要时间块模态框 */}
      <Modal visible={modalType === 'editMajorBlock' && modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑主要时间块</Text>
            
            <Text style={styles.inputLabel}>名称:</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockName}
              onChangeText={setNewBlockName}
              placeholder="输入时间块名称"
              placeholderTextColor="#888"
            />
            
            <Text style={styles.inputLabel}>图标:</Text>
            <ScrollView horizontal style={styles.emojiContainer}>
              {EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setNewBlockIcon(emoji)}
                  style={[
                    styles.emojiOption,
                    newBlockIcon === emoji && styles.selectedEmoji
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.inputLabel}>总时长 (分钟):</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockDuration.toString()}
              onChangeText={(text) => setNewBlockDuration(parseInt(text) || 0)}
              placeholder="输入总时长"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditMajorBlock} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 编辑子时间块模态框 */}
      <Modal visible={modalType === 'editChildBlock' && modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>编辑时间块</Text>
            
            <Text style={styles.inputLabel}>名称:</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockName}
              onChangeText={setNewBlockName}
              placeholder="输入时间块名称"
              placeholderTextColor="#888"
            />
            
            <Text style={styles.inputLabel}>图标:</Text>
            <ScrollView horizontal style={styles.emojiContainer}>
              {EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setNewBlockIcon(emoji)}
                  style={[
                    styles.emojiOption,
                    newBlockIcon === emoji && styles.selectedEmoji
                  ]}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.inputLabel}>颜色:</Text>
            <View style={styles.colorContainer}>
              {COLOR_OPTIONS.map(color => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewBlockColor(color)}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newBlockColor === color && styles.selectedColor
                  ]}
                />
              ))}
            </View>
            
            <Text style={styles.inputLabel}>时长 (分钟):</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockDuration.toString()}
              onChangeText={(text) => setNewBlockDuration(parseInt(text) || 0)}
              placeholder="输入时长"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditChildBlock} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 临时时间块创建模态框 */}
      <Modal visible={modalType === 'tempBlock' && modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>创建临时时间块</Text>
            
            <Text style={styles.inputLabel}>名称:</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockName}
              onChangeText={setNewBlockName}
              placeholder="输入临时时间块名称"
              placeholderTextColor="#888"
            />
            
            <Text style={styles.inputLabel}>时长 (分钟):</Text>
            <TextInput
              style={styles.textInput}
              value={newBlockDuration.toString()}
              onChangeText={(text) => setNewBlockDuration(parseInt(text) || 0)}
              placeholder="输入时长"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={closeModal} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateTempBlock} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>创建</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 活动日志模态框 */}
      <ActivityLogComponent
        visible={showActivityLog}
        logs={dayTimeManager.getActivityLog()}
        onClose={() => setShowActivityLog(false)}
      />

      {/* 每日统计模态框 */}
      <Modal visible={showDailyStats} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>今日统计</Text>
            <TouchableOpacity onPress={() => setShowDailyStats(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsContainer}>
            {(() => {
              const stats = dayTimeManager.getDailyStats();
              return (
                <View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>总活跃时间:</Text>
                    <Text style={styles.statValue}>{formatTime(stats.totalActiveTime)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>总暂停时间:</Text>
                    <Text style={styles.statValue}>{formatTime(stats.totalPauseTime)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>完成任务数:</Text>
                    <Text style={styles.statValue}>{stats.completedTasks}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>切换次数:</Text>
                    <Text style={styles.statValue}>{stats.switchCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>暂停次数:</Text>
                    <Text style={styles.statValue}>{stats.pauseCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>活动记录数:</Text>
                    <Text style={styles.statValue}>{stats.totalActivities}</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default App;