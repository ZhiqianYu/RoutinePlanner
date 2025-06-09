// src/managers/StorageManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, TimeBlock } from '../types';
import { STORAGE_KEYS, DEFAULT_APP_SETTINGS } from '../constants';
import { safeJsonParse, deepClone } from '../utils';

export class StorageManager {
  /**
   * 加载应用设置
   */
  static async loadSettings(): Promise<AppSettings> {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      if (savedSettings) {
        const parsedSettings = safeJsonParse(savedSettings, DEFAULT_APP_SETTINGS);
        // 合并默认设置，确保新增的设置项有默认值
        return { ...DEFAULT_APP_SETTINGS, ...parsedSettings };
      }
      return DEFAULT_APP_SETTINGS;
    } catch (error) {
      console.error('加载设置失败:', error);
      return DEFAULT_APP_SETTINGS;
    }
  }

  /**
   * 保存应用设置
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('保存设置失败:', error);
      throw error;
    }
  }

  /**
   * 更新部分设置
   */
  static async updateSettings(partialSettings: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const currentSettings = await this.loadSettings();
      const updatedSettings = { ...currentSettings, ...partialSettings };
      await this.saveSettings(updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('更新设置失败:', error);
      throw error;
    }
  }

  /**
   * 加载配置
   */
  static async loadConfiguration(): Promise<{
    majorBlocks: TimeBlock[];
    timeBlocks: TimeBlock[];
  } | null> {
    try {
      const savedConfig = await AsyncStorage.getItem(STORAGE_KEYS.DAY_TIME_CONFIG);
      if (savedConfig) {
        const config = safeJsonParse(savedConfig, null);
        if (config && config.majorBlocks && config.timeBlocks) {
          return {
            majorBlocks: config.majorBlocks,
            timeBlocks: config.timeBlocks
          };
        }
      }
      return null;
    } catch (error) {
      console.error('加载配置失败:', error);
      return null;
    }
  }

  /**
   * 保存配置
   */
  static async saveConfiguration(majorBlocks: TimeBlock[], timeBlocks: TimeBlock[]): Promise<void> {
    try {
      const config = { 
        majorBlocks: deepClone(majorBlocks), 
        timeBlocks: deepClone(timeBlocks),
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.DAY_TIME_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 清除所有数据
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.APP_SETTINGS,
        STORAGE_KEYS.DAY_TIME_CONFIG
      ]);
    } catch (error) {
      console.error('清除数据失败:', error);
      throw error;
    }
  }

  /**
   * 导出数据
   */
  static async exportData(): Promise<string> {
    try {
      const settings = await this.loadSettings();
      const config = await this.loadConfiguration();
      
      const exportData = {
        settings,
        config,
        exportTime: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('导出数据失败:', error);
      throw error;
    }
  }

  /**
   * 导入数据
   */
  static async importData(dataString: string): Promise<void> {
    try {
      const importData = safeJsonParse(dataString, null);
      
      if (!importData || !importData.settings || !importData.config) {
        throw new Error('数据格式无效');
      }
      
      // 验证和导入设置
      if (importData.settings) {
        const validatedSettings = { ...DEFAULT_APP_SETTINGS, ...importData.settings };
        await this.saveSettings(validatedSettings);
      }
      
      // 验证和导入配置
      if (importData.config && importData.config.majorBlocks && importData.config.timeBlocks) {
        await this.saveConfiguration(importData.config.majorBlocks, importData.config.timeBlocks);
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储使用情况
   */
  static async getStorageInfo(): Promise<{
    totalSize: number;
    settingsSize: number;
    configSize: number;
  }> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
      const config = await AsyncStorage.getItem(STORAGE_KEYS.DAY_TIME_CONFIG);
      
      const settingsSize = settings ? new Blob([settings]).size : 0;
      const configSize = config ? new Blob([config]).size : 0;
      
      return {
        totalSize: settingsSize + configSize,
        settingsSize,
        configSize
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return { totalSize: 0, settingsSize: 0, configSize: 0 };
    }
  }
}