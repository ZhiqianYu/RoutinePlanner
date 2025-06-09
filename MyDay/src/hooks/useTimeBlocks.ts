// src/hooks/useTimeBlocks.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimeBlock, DayTemplate } from '../types';
import { StorageManager, DayTimeManager } from '../managers';
import { generateId } from '../utils';

export const useTimeBlocks = () => {
  const [majorBlocks, setMajorBlocks] = useState<TimeBlock[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const dayTimeManager = useRef(new DayTimeManager()).current;

  /**
   * 加载配置
   */
  const loadConfiguration = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const config = await StorageManager.loadConfiguration();
      if (config) {
        setMajorBlocks(config.majorBlocks);
        setTimeBlocks(config.timeBlocks);
        dayTimeManager.setMajorBlocks(config.majorBlocks);
        
        // 初始化所有会话
        config.timeBlocks.forEach(parentBlock => {
          if (parentBlock.children) {
            parentBlock.children.forEach(childBlock => {
              dayTimeManager.initializeSession(childBlock);
            });
          }
        });
        
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载配置失败';
      setError(errorMessage);
      console.error('加载配置失败:', err);
      setIsFirstTime(true);
    } finally {
      setIsLoading(false);
    }
  }, [dayTimeManager]);

  /**
   * 保存配置
   */
  const saveConfiguration = useCallback(async (newMajorBlocks?: TimeBlock[], newTimeBlocks?: TimeBlock[]) => {
    try {
      setError(null);
      const majorToSave = newMajorBlocks || majorBlocks;
      const timeToSave = newTimeBlocks || timeBlocks;
      
      await StorageManager.saveConfiguration(majorToSave, timeToSave);
      
      if (newMajorBlocks) setMajorBlocks(newMajorBlocks);
      if (newTimeBlocks) setTimeBlocks(newTimeBlocks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存配置失败';
      setError(errorMessage);
      console.error('保存配置失败:', err);
      throw err;
    }
  }, [majorBlocks, timeBlocks]);

  /**
   * 应用模板
   */
  const applyTemplate = useCallback(async (template: DayTemplate) => {
    try {
      setError(null);
      const newMajorBlocks = template.majorBlocks;
      const newTimeBlocks = template.subBlocks.reduce((acc, subBlock) => {
        const parentIndex = acc.findIndex(parent => parent.id === subBlock.parentId);
        if (parentIndex !== -1) {
          if (!acc[parentIndex].children) acc[parentIndex].children = [];
          acc[parentIndex].children!.push({
            id: generateId('child_'),
            ...subBlock
          });
        }
        return acc;
      }, newMajorBlocks.map(major => ({ ...major, children: [] as TimeBlock[] })));

      setMajorBlocks(newMajorBlocks);
      setTimeBlocks(newTimeBlocks);
      dayTimeManager.setMajorBlocks(newMajorBlocks);
      
      // 初始化所有会话
      newTimeBlocks.forEach(parentBlock => {
        if (parentBlock.children) {
          parentBlock.children.forEach(childBlock => {
            dayTimeManager.initializeSession(childBlock);
          });
        }
      });
      
      await saveConfiguration(newMajorBlocks, newTimeBlocks);
      setIsFirstTime(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '应用模板失败';
      setError(errorMessage);
      console.error('应用模板失败:', err);
      throw err;
    }
  }, [dayTimeManager, saveConfiguration]);

  /**
   * 添加子时间块
   */
  const addChildBlock = useCallback(async (parentId: string, blockData: Partial<TimeBlock>) => {
    try {
      setError(null);
      const newChild: TimeBlock = {
        id: generateId('child_'),
        name: blockData.name || '新时间块',
        icon: blockData.icon || '⭐',
        color: blockData.color || '#7C3AED',
        duration: blockData.duration || 60,
      };

      const updatedBlocks = timeBlocks.map(block => {
        if (block.id === parentId) {
          return {
            ...block,
            children: [...(block.children || []), newChild]
          };
        }
        return block;
      });

      setTimeBlocks(updatedBlocks);
      dayTimeManager.initializeSession(newChild);
      await saveConfiguration(majorBlocks, updatedBlocks);
      
      return newChild;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加时间块失败';
      setError(errorMessage);
      console.error('添加时间块失败:', err);
      throw err;
    }
  }, [timeBlocks, majorBlocks, dayTimeManager, saveConfiguration]);

  /**
   * 删除时间块
   */
  const deleteTimeBlock = useCallback(async (blockId: string, parentId: string, autoRedistribute = true) => {
    try {
      setError(null);
      let deletedDuration = 0;
      
      const updatedBlocks = timeBlocks.map(block => {
        if (block.id === parentId && block.children) {
          const deletedChild = block.children.find(child => child.id === blockId);
          deletedDuration = deletedChild ? deletedChild.duration : 0;
          
          const newChildren = block.children.filter(child => child.id !== blockId);
          
          // 如果启用自动重分配且还有其他子项目
          if (autoRedistribute && newChildren.length > 0 && deletedDuration > 0) {
            const totalCurrentTime = newChildren.reduce((sum, child) => sum + child.duration, 0);
            if (totalCurrentTime > 0) {
              newChildren.forEach(child => {
                const proportion = child.duration / totalCurrentTime;
                const additionalTime = Math.floor(deletedDuration * proportion);
                child.duration += additionalTime;
                
                // 同步更新session数据
                const session = dayTimeManager.getSession(child.id);
                if (session) {
                  session.duration += additionalTime;
                  session.remainingTime += additionalTime;
                }
              });
            }
          }
          
          return { ...block, children: newChildren };
        }
        return block;
      });
      
      setTimeBlocks(updatedBlocks);
      await saveConfiguration(majorBlocks, updatedBlocks);
      
      return deletedDuration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除时间块失败';
      setError(errorMessage);
      console.error('删除时间块失败:', err);
      throw err;
    }
  }, [timeBlocks, majorBlocks, dayTimeManager, saveConfiguration]);

  /**
   * 创建临时时间块
   */
  const createTempBlock = useCallback(async (blockData: Partial<TimeBlock>) => {
    try {
      setError(null);
      const tempBlock: TimeBlock = {
        id: generateId('temp_'),
        name: blockData.name || '临时时间块',
        duration: blockData.duration || 60,
        icon: '⚡',
        color: '#ff6b6b',
        isTemporary: true,
      };

      if (timeBlocks.length > 0) {
        const updatedBlocks = timeBlocks.map((block, index) => {
          if (index === 0) {
            return {
              ...block,
              children: [...(block.children || []), tempBlock]
            };
          }
          return block;
        });

        setTimeBlocks(updatedBlocks);
        dayTimeManager.initializeSession(tempBlock);
        await saveConfiguration(majorBlocks, updatedBlocks);
      }

      return tempBlock;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建临时时间块失败';
      setError(errorMessage);
      console.error('创建临时时间块失败:', err);
      throw err;
    }
  }, [timeBlocks, majorBlocks, dayTimeManager, saveConfiguration]);

  /**
   * 更新时间块
   */
  const updateTimeBlock = useCallback(async (blockId: string, updates: Partial<TimeBlock>) => {
    try {
      setError(null);
      const updatedBlocks = timeBlocks.map(parentBlock => ({
        ...parentBlock,
        children: parentBlock.children?.map(child => 
          child.id === blockId ? { ...child, ...updates } : child
        )
      }));

      setTimeBlocks(updatedBlocks);
      await saveConfiguration(majorBlocks, updatedBlocks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新时间块失败';
      setError(errorMessage);
      console.error('更新时间块失败:', err);
      throw err;
    }
  }, [timeBlocks, majorBlocks, saveConfiguration]);

  // 初始化加载
  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  return {
    majorBlocks,
    timeBlocks,
    isLoading,
    isFirstTime,
    error,
    dayTimeManager,
    applyTemplate,
    addChildBlock,
    deleteTimeBlock,
    createTempBlock,
    updateTimeBlock,
    saveConfiguration,
    reloadConfiguration: loadConfiguration,
  };
};