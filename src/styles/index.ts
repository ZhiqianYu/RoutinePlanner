// src/styles/index.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // 当前会话显示
  currentSessionCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  focusMode: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#444',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#fff',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f0f0f0', // 改为偏白色
    fontFamily: 'monospace',
  },
  sessionElapsed: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  pauseButtonText: {
    fontSize: 20,
  },
  resumeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 20,
    padding: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  resumeButtonText: {
    fontSize: 20,
  },
  
  // 进度条
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#aaa',
    minWidth: 35,
    textAlign: 'right',
  },
  
  // 主要时间块
  majorBlocksContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginLeft: 4,
  },
  majorBlockCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  majorBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  majorBlockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  majorBlockTime: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // 时间块选择器
  blockSelector: {
    marginBottom: 20,
  },
  blockSelectorItem: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  blockSelectorIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  blockSelectorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  blockSelectorTime: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
  },
  tempLabel: {
    fontSize: 8,
    color: '#ffa500',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  addTempButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  addTempButtonText: {
    fontSize: 20,
    marginBottom: 4,
  },
  addTempButtonLabel: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  
  // 父时间块
  parentBlock: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  activeParentBlock: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  collapsedParentBlock: {
    opacity: 0.8,
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
  parentBlockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentBlockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  parentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  collapseIndicator: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    marginRight: 12,
    transform: [{ rotate: '0deg' }],
  },
  collapseIndicatorCollapsed: {
    transform: [{ rotate: '-90deg' }],
  },
  addChildButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addChildButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // 子时间块
  childrenContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  childBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderLeftWidth: 3,
    position: 'relative',
  },
  activeChildBlock: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  childTime: {
    fontSize: 12,
    color: '#4CAF50',
  },
  childUsed: {
    fontSize: 11,
    color: '#aaa',
  },
  pauseInfo: {
    fontSize: 11,
    color: '#ff9800',
  },
  tempIndicator: {
    fontSize: 10,
    color: '#ffa500',
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  activeIndicator: {
    marginLeft: 8,
  },
  activeIndicatorText: {
    fontSize: 16,
  },
  
  // 模态框
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
    minWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // 表单输入
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  
  // 选择器
  emojiContainer: {
    marginVertical: 8,
  },
  emojiOption: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  selectedEmoji: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  emojiText: {
    fontSize: 20,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#fff',
  },
  
  // 按钮
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flex: 1,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // 暂停目标选择
  destinationOption: {
    backgroundColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  destinationInfo: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  destinationHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // 设置
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  settingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  settingButton: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  settingButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  settingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // 模板
  templateList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  templateCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  templateSubBlocks: {
    fontSize: 12,
    color: '#666',
  },
  
  // 活动日志
  activityLogList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  activityLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#aaa',
  },
  
  // 统计
  statsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});