// src/hooks/useAppSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../types';
import { StorageManager } from '../managers';
import { DEFAULT_APP_SETTINGS } from '../constants';

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载设置
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedSettings = await StorageManager.loadSettings();
      setSettings(loadedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载设置失败';
      setError(errorMessage);
      console.error('加载设置失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 保存设置
   */
  const saveSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      setError(null);
      const updatedSettings = await StorageManager.updateSettings(newSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存设置失败';
      setError(errorMessage);
      console.error('保存设置失败:', err);
      throw err;
    }
  }, []);

  /**
   * 重置为默认设置
   */
  const resetSettings = useCallback(async () => {
    try {
      setError(null);
      await StorageManager.saveSettings(DEFAULT_APP_SETTINGS);
      setSettings(DEFAULT_APP_SETTINGS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置设置失败';
      setError(errorMessage);
      console.error('重置设置失败:', err);
      throw err;
    }
  }, []);

  /**
   * 更新单个设置项
   */
  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ) => {
    return saveSettings({ [key]: value });
  }, [saveSettings]);

  // 初始化加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    updateSetting,
    resetSettings,
    reloadSettings: loadSettings,
  };
};