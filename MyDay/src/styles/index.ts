// src/styles/index.ts
import { StyleSheet, Dimensions } from 'react-native';
import { DARK_THEME, LIGHT_THEME, FOCUS_MODE_CONFIG } from '../constants';
import { Theme } from '../types';

const { width, height } = Dimensions.get('window');

// 创建主题相关的样式
export const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.cardBackground,
  },
  headerButtonText: {
    fontSize: 18,
    color: theme.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // 当前会话样式 - 修改字体颜色为白色
  currentSessionCard: {
    backgroundColor: theme.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // 强制白色，不受主题影响
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff', // 强制白色，不受主题影响
    fontFamily: 'monospace', // 使用等宽字体
  },
  sessionElapsed: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  pauseButton: {
    backgroundColor: theme.warning,
    padding: 12,
    borderRadius: 8,
  },
  resumeButton: {
    backgroundColor: theme.success,
    padding: 12,
    borderRadius: 8,
  },
  pauseButtonText: {
    fontSize: 20,
  },
  resumeButtonText: {
    fontSize: 20,
  },
  
  // 专注模式样式
  focusMode: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: FOCUS_MODE_CONFIG.backgroundColor,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: FOCUS_MODE_CONFIG.padding,
  },
  focusModeCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.9)',
    padding: 40,
    borderRadius: FOCUS_MODE_CONFIG.borderRadius,
    alignItems: 'center',
    minWidth: width * 0.8,
  },
  focusModeSessionName: {
    fontSize: FOCUS_MODE_CONFIG.fontSize.name,
    fontWeight: 'bold',
    color: FOCUS_MODE_CONFIG.textColor,
    marginBottom: 20,
    textAlign: 'center',
  },
  focusModeSessionTime: {
    fontSize: FOCUS_MODE_CONFIG.fontSize.time,
    fontWeight: '300',
    color: FOCUS_MODE_CONFIG.textColor,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  focusModeStatus: {
    fontSize: FOCUS_MODE_CONFIG.fontSize.status,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  focusModeExitButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 20,
  },
  focusModeExitText: {
    color: '#ffffff',
    fontSize: 18,
  },
  
  // 悬浮专注模式按钮
  floatingFocusButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  floatingFocusButtonText: {
    fontSize: 24,
    color: '#ffffff',
  },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.border,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  majorBlocksContainer: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  majorBlockCard: {
    backgroundColor: theme.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  majorBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  majorBlockName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  majorBlockTime: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  blockSelector: {
    marginBottom: 16,
  },
  blockSelectorItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  blockSelectorIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  blockSelectorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  blockSelectorTime: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.8,
  },
  tempLabel: {
    fontSize: 8,
    color: '#FFE082',
    fontWeight: 'bold',
    marginTop: 2,
  },
  addTempButton: {
    backgroundColor: theme.cardBackground,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  addTempButtonText: {
    fontSize: 20,
    marginBottom: 4,
  },
  addTempButtonLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  parentBlock: {
    backgroundColor: theme.cardBackground,
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeParentBlock: {
    borderWidth: 2,
    borderColor: theme.success,
  },
  collapsedParentBlock: {
    opacity: 0.7,
  },
  parentBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  parentBlockTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parentIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  parentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  // 调整按钮位置 - 展开按钮在右侧
  parentBlockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addChildButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  addChildButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  collapseIndicator: {
    fontSize: 12,
    color: '#fff',
    padding: 8,
    transform: [{ rotate: '0deg' }],
  },
  collapseIndicatorCollapsed: {
    transform: [{ rotate: '-90deg' }],
  },
  childrenContainer: {
    backgroundColor: theme.background,
  },
  childBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderLeftWidth: 4,
    position: 'relative',
  },
  activeChildBlock: {
    backgroundColor: theme.cardBackground,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  childContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 30,
  },
  childIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  childTime: {
    fontSize: 14,
    color: theme.success,
  },
  childUsed: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  pauseInfo: {
    fontSize: 12,
    color: theme.warning,
  },
  tempIndicator: {
    fontSize: 10,
    color: '#FFE082',
    fontWeight: 'bold',
  },
  activeIndicator: {
    marginLeft: 12,
  },
  activeIndicatorText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
    margin: 20,
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: theme.textSecondary,
    padding: 8,
  },
  templateList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  templateCard: {
    backgroundColor: theme.cardBackground,
    padding: 20,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  templateSubBlocks: {
    fontSize: 12,
    color: theme.textMuted,
  },
  destinationOption: {
    backgroundColor: theme.background,
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 2,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  destinationInfo: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  destinationHint: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: theme.background,
    color: theme.textPrimary,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emojiContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  emojiOption: {
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: theme.background,
  },
  selectedEmoji: {
    backgroundColor: theme.accent,
  },
  emojiText: {
    fontSize: 20,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: theme.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: theme.textMuted,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: theme.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: theme.info,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityLogList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activityLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 16,
    color: theme.textPrimary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.success,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.textPrimary,
    marginBottom: 8,
  },
  settingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  settingButton: {
    backgroundColor: theme.background,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  settingButtonActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  settingButtonText: {
    color: theme.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  settingButtonTextActive: {
    color: '#fff',
  },
  // 声音预览按钮
  soundPreviewButton: {
    backgroundColor: theme.info,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  soundPreviewText: {
    color: '#fff',
    fontSize: 12,
  },
});

// 默认深色主题样式
export const styles = createThemedStyles(DARK_THEME);

// 浅色主题样式
export const lightStyles = createThemedStyles(LIGHT_THEME);

// 工具函数：根据主题获取样式
export const getThemedStyles = (themeName: 'light' | 'dark' | 'auto') => {
  // auto 模式可以后续根据系统主题来判断
  switch (themeName) {
    case 'light':
      return lightStyles;
    case 'dark':
    case 'auto':
    default:
      return styles;
  }
};