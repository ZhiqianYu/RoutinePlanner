// src/types/global.d.ts
declare global {
  var __DEV__: boolean;
  var __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
  
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: any;
  }
}

// React Native 特定的全局变量
declare var global: any;
declare var __fbBatchedBridge: any;

export {};