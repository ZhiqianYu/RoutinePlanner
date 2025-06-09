// src/managers/DayTimeManager.ts
import { TimeBlock, Session, ActivityLog, TimeDisplay } from '../types';
import { generateId, isToday } from '../utils';

export class DayTimeManager {
  private sessions = new Map<string, Session>();
  private activityLog: ActivityLog[] = [];
  private majorBlocks: TimeBlock[] = [];
  private pauseDestinationBlock: TimeBlock | null = null;
  private collapseStates = new Map<string, boolean>();
  private parentChildMap = new Map<string, string[]>(); // 追踪父子关系

  /**
   * 设置主要时间块
   */
  setMajorBlocks(blocks: TimeBlock[]): void {
    this.majorBlocks = blocks.map(block => ({
      ...block,
      consumedTime: 0, // 重置为0，将通过计算得出
    }));
    
    this.pauseDestinationBlock = this.majorBlocks.find(block => 
      block.type === 'rest' || 
      block.name.includes('休息') || 
      block.name.includes('睡眠')
    ) || this.majorBlocks[1] || null;
  }

  /**
   * 更新父子关系映射
   */
  updateParentChildMap(timeBlocks: TimeBlock[]): void {
    this.parentChildMap.clear();
    timeBlocks.forEach(parentBlock => {
      if (parentBlock.children) {
        this.parentChildMap.set(parentBlock.id, parentBlock.children.map(child => child.id));
      }
    });
  }

  /**
   * 计算主要时间块的实际已用时间
   */
  private calculateMajorBlockConsumedTime(majorBlockId: string): number {
    let totalConsumed = 0;
    
    // 获取该主要时间块下的所有子时间块
    const childIds = this.parentChildMap.get(majorBlockId) || [];
    
    // 累加所有子时间块的已用时间
    childIds.forEach(childId => {
      const session = this.sessions.get(childId);
      if (session) {
        totalConsumed += session.totalUsedTime;
      }
    });
    
    // 如果是休息类型的时间块，还要加上暂停时间
    const majorBlock = this.majorBlocks.find(block => block.id === majorBlockId);
    if (majorBlock && (majorBlock.type === 'rest' || majorBlock.name.includes('休息') || majorBlock.name.includes('睡觉'))) {
      // 累加所有会话的暂停时间（如果选择计入此时间块）
      Array.from(this.sessions.values()).forEach(session => {
        session.pauseHistory.forEach(pause => {
          if (pause.targetBlock === majorBlock.name) {
            totalConsumed += pause.duration;
          }
        });
      });
    }
    
    return totalConsumed;
  }

  /**
   * 更新所有主要时间块的已用时间
   */
  private updateAllMajorBlocksConsumedTime(): void {
    this.majorBlocks.forEach(majorBlock => {
      majorBlock.consumedTime = this.calculateMajorBlockConsumedTime(majorBlock.id);
    });
  }

  /**
   * 初始化会话
   */
  initializeSession(block: TimeBlock): Session {
    if (!this.sessions.has(block.id)) {
      this.sessions.set(block.id, {
        ...block,
        remainingTime: block.duration,
        totalUsedTime: 0,
        totalPauseTime: 0,
        isActive: false,
        lastStartTime: null,
        pauseStartTime: null,
        pauseHistory: [],
        currentPauseTarget: null,
        accumulatedTime: 0, // 秒级累计时间
        accumulatedSeconds: 0, // 新增：记录累计的秒数
      });
    }
    return this.sessions.get(block.id)!;
  }

  /**
   * 开始会话
   */
  startSession(blockId: string): Session | null {
    const session = this.sessions.get(blockId);
    if (session) {
      session.isActive = true;
      session.lastStartTime = Date.now();
      
      if (session.pauseStartTime) {
        this.endPauseTime(blockId);
      }
      
      this.logActivity('start', session.name, session.remainingTime);
      return session;
    }
    return null;
  }

  /**
   * 暂停会话 - 修复精度问题
   */
  pauseSession(blockId: string, destinationBlockId?: string): { 
    session: Session; 
    activeTime: number; 
    targetBlock: TimeBlock | null 
  } | null {
    const session = this.sessions.get(blockId);
    if (!session || !session.isActive || !session.lastStartTime) return null;

    const pauseStartTime = Date.now();
    const activeTimeMs = pauseStartTime - session.lastStartTime;
    const activeTimeSeconds = Math.floor(activeTimeMs / 1000);
    const activeTimeMinutes = Math.floor(activeTimeSeconds / 60);
    const remainderSeconds = activeTimeSeconds % 60;
    
    // 更新累计时间（保持秒级精度）
    session.accumulatedSeconds = (session.accumulatedSeconds || 0) + activeTimeSeconds;
    session.accumulatedTime = Math.floor(session.accumulatedSeconds / 60); // 分钟显示
    
    // 更新剩余时间和已用时间
    session.remainingTime = Math.max(0, session.remainingTime - activeTimeMinutes);
    session.totalUsedTime += activeTimeMinutes;
    session.isActive = false;
    session.pauseStartTime = pauseStartTime;
    
    const targetBlock = destinationBlockId ? 
      this.majorBlocks.find(b => b.id === destinationBlockId) : 
      this.pauseDestinationBlock;
    
    session.currentPauseTarget = targetBlock;
    
    // 更新主要时间块统计
    this.updateAllMajorBlocksConsumedTime();
    
    this.logActivity('pause', 
      `暂停 ${session.name}，时间将计入 ${targetBlock?.name || '未知'}`, 
      session.remainingTime, 
      activeTimeMinutes
    );
    
    return { session, activeTime: activeTimeMinutes, targetBlock };
  }

  /**
   * 结束暂停时间
   */
  endPauseTime(blockId: string): number {
    const session = this.sessions.get(blockId);
    if (!session || !session.pauseStartTime) return 0;

    const pauseDurationMs = Date.now() - session.pauseStartTime;
    const pauseDurationSeconds = Math.floor(pauseDurationMs / 1000);
    const pauseDurationMinutes = Math.floor(pauseDurationSeconds / 60);
    const targetBlock = session.currentPauseTarget;
    
    session.totalPauseTime += pauseDurationMinutes;
    session.pauseStartTime = null;
    session.currentPauseTarget = null;
    
    // 记录暂停历史
    session.pauseHistory.push({
      duration: pauseDurationMinutes,
      timestamp: new Date(),
      targetBlock: targetBlock?.name,
    });
    
    // 更新主要时间块统计
    this.updateAllMajorBlocksConsumedTime();
    
    this.logActivity('pause_end', 
      `结束暂停，暂停了 ${pauseDurationMinutes} 分钟，计入 ${targetBlock?.name || '未知'}`,
      0, 
      pauseDurationMinutes
    );
    
    return pauseDurationMinutes;
  }

  /**
   * 已废弃 - 主要时间块时间现在通过计算得出
   */
  consumeMajorBlockTime(blockId: string, minutes: number): void {
    // 这个方法已废弃，因为现在通过计算子时间块来得出主要时间块的消耗
    // 保留方法以免破坏现有调用
    console.warn('consumeMajorBlockTime is deprecated, use updateAllMajorBlocksConsumedTime instead');
  }

  /**
   * 切换会话
   */
  switchToSession(fromBlockId: string | null, toBlockId: string, pauseDestination?: string): { 
    pauseResult: { session: Session; activeTime: number; targetBlock: TimeBlock | null } | null;
    newSession: Session | null;
  } {
    let pauseResult = null;
    
    if (fromBlockId) {
      pauseResult = this.pauseSession(fromBlockId, pauseDestination);
    }
    
    const newSession = this.startSession(toBlockId);
    
    this.logActivity('switch', 
      `从 ${this.sessions.get(fromBlockId || '')?.name || '无'} 切换到 ${newSession?.name || '未知'}`,
      newSession?.remainingTime || 0
    );
    
    return { pauseResult, newSession };
  }

  /**
   * 获取当前暂停时间（支持秒级精度）
   */
  getCurrentPauseTime(blockId: string): TimeDisplay {
    const session = this.sessions.get(blockId);
    if (session && session.pauseStartTime) {
      const pauseMs = Date.now() - session.pauseStartTime;
      const totalSeconds = Math.floor(pauseMs / 1000);
      return {
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60
      };
    }
    return { minutes: 0, seconds: 0 };
  }

  /**
   * 获取当前已用时间（支持秒级精度）
   */
  getCurrentElapsedTime(blockId: string): TimeDisplay {
    const session = this.sessions.get(blockId);
    if (session && session.isActive && session.lastStartTime) {
      const currentElapsedMs = Date.now() - session.lastStartTime;
      const currentElapsedSeconds = Math.floor(currentElapsedMs / 1000);
      const totalSeconds = (session.accumulatedSeconds || 0) + currentElapsedSeconds;
      return {
        minutes: Math.floor(totalSeconds / 60),
        seconds: totalSeconds % 60
      };
    }
    return {
      minutes: session ? session.accumulatedTime : 0,
      seconds: session ? (session.accumulatedSeconds || 0) % 60 : 0
    };
  }

  /**
   * 获取当前剩余时间（支持秒级精度）
   */
  getCurrentRemainingTime(blockId: string): TimeDisplay {
    const session = this.sessions.get(blockId);
    if (session && session.isActive && session.lastStartTime) {
      const currentElapsedMs = Date.now() - session.lastStartTime;
      const currentElapsedSeconds = Math.floor(currentElapsedMs / 1000);
      const totalElapsedSeconds = (session.accumulatedSeconds || 0) + currentElapsedSeconds;
      const remainingTotalSeconds = Math.max(0, session.duration * 60 - totalElapsedSeconds);
      return {
        minutes: Math.floor(remainingTotalSeconds / 60),
        seconds: remainingTotalSeconds % 60
      };
    }
    return {
      minutes: session ? session.remainingTime : 0,
      seconds: 0
    };
  }

  /**
   * 获取主要时间块状态 - 使用计算出的时间
   */
  getMajorBlocksStatus(): Array<{ id: string; name: string; remaining: number; progressPercent: number }> {
    // 确保统计是最新的
    this.updateAllMajorBlocksConsumedTime();
    
    return this.majorBlocks.map(block => ({
      id: block.id,
      name: block.name,
      remaining: block.duration - (block.consumedTime || 0),
      progressPercent: ((block.consumedTime || 0) / block.duration) * 100
    }));
  }

  /**
   * 记录活动日志
   */
  logActivity(type: ActivityLog['type'], description: string, remainingTime = 0, duration = 0): void {
    const activity: ActivityLog = {
      id: generateId('activity_'),
      timestamp: new Date(),
      type,
      description,
      remainingTime,
      duration,
      majorBlocksStatus: this.getMajorBlocksStatus(),
    };
    
    this.activityLog.push(activity);
    
    // 保留24小时内的记录
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.activityLog = this.activityLog.filter(log => log.timestamp.getTime() > oneDayAgo);
  }

  /**
   * 重置会话
   */
  resetSession(blockId: string): void {
    const session = this.sessions.get(blockId);
    if (session) {
      const originalDuration = session.duration;
      Object.assign(session, {
        remainingTime: originalDuration,
        totalUsedTime: 0,
        totalPauseTime: 0,
        isActive: false,
        lastStartTime: null,
        pauseStartTime: null,
        pauseHistory: [],
        currentPauseTarget: null,
        accumulatedTime: 0,
        accumulatedSeconds: 0,
      });
      
      // 更新主要时间块统计
      this.updateAllMajorBlocksConsumedTime();
    }
  }

  /**
   * 获取活动日志
   */
  getActivityLog(): ActivityLog[] {
    return [...this.activityLog].reverse();
  }

  /**
   * 获取每日统计 - 使用修正后的时间计算
   */
  getDailyStats() {
    const todayLogs = this.activityLog.filter(log => isToday(log.timestamp));

    const completedTasks = todayLogs.filter(log => log.type === 'complete').length;
    const switchCount = todayLogs.filter(log => log.type === 'switch').length;
    const pauseCount = todayLogs.filter(log => log.type === 'pause').length;
    
    // 确保统计是最新的
    this.updateAllMajorBlocksConsumedTime();
    
    const totalActiveTime = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.totalUsedTime, 0);
    const totalPauseTime = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.totalPauseTime, 0);

    return {
      totalActiveTime,
      totalPauseTime,
      completedTasks,
      switchCount,
      pauseCount,
      majorBlocksStatus: this.getMajorBlocksStatus(),
      totalActivities: todayLogs.length,
    };
  }

  /**
   * 设置折叠状态
   */
  setCollapseState(parentId: string, isCollapsed: boolean): void {
    this.collapseStates.set(parentId, isCollapsed);
  }

  /**
   * 获取折叠状态
   */
  getCollapseState(parentId: string): boolean {
    return this.collapseStates.get(parentId) || false;
  }

  /**
   * 获取会话信息
   */
  getSession(blockId: string): Session | undefined {
    return this.sessions.get(blockId);
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): Map<string, Session> {
    return new Map(this.sessions);
  }

  /**
   * 获取暂停目标块
   */
  getPauseDestinationBlock(): TimeBlock | null {
    return this.pauseDestinationBlock;
  }

  /**
   * 获取主要时间块（确保统计最新）
   */
  getMajorBlocks(): TimeBlock[] {
    this.updateAllMajorBlocksConsumedTime();
    return [...this.majorBlocks];
  }
}