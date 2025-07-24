import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * useLocalStorage - ローカルストレージと同期する状態管理フック
 * @param key - ローカルストレージのキー
 * @param initialValue - 初期値
 * @returns [値, セッター関数, 削除関数]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // 初期値を取得する関数
  const getStoredValue = useCallback((): T => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  // 状態を初期化
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // 値を設定する関数
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          
          // カスタムイベントを発火して他のタブ/ウィンドウに変更を通知
          window.dispatchEvent(
            new CustomEvent('local-storage', {
              detail: { key, newValue: valueToStore },
            })
          );
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // 値を削除する関数
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        // カスタムイベントを発火
        window.dispatchEvent(
          new CustomEvent('local-storage', {
            detail: { key, newValue: null },
          })
        );
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // 他のタブ/ウィンドウでの変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.newValue ?? initialValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('local-storage', handleCustomStorageChange as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('local-storage', handleCustomStorageChange as EventListener);
      }
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useSessionStorage - セッションストレージと同期する状態管理フック
 * @param key - セッションストレージのキー
 * @param initialValue - 初期値
 * @returns [値, セッター関数, 削除関数]
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  const getStoredValue = useCallback((): T => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.sessionStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * useStorageState - ローカルストレージまたはセッションストレージを選択できる汎用フック
 * @param key - ストレージのキー
 * @param initialValue - 初期値
 * @param storageType - ストレージタイプ
 * @returns [値, セッター関数, 削除関数]
 */
export function useStorageState<T>(
  key: string,
  initialValue: T,
  storageType: 'localStorage' | 'sessionStorage' = 'localStorage'
): [T, (value: SetValue<T>) => void, () => void] {
  if (storageType === 'sessionStorage') {
    return useSessionStorage(key, initialValue);
  }
  return useLocalStorage(key, initialValue);
}

// ユーティリティ関数
export const storageUtils = {
  /**
   * ローカルストレージから値を取得
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * ローカルストレージに値を設定
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  },

  /**
   * ローカルストレージから値を削除
   */
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  /**
   * ローカルストレージをクリア
   */
  clear: (): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * ストレージサイズを取得（概算）
   */
  getSize: (): number => {
    try {
      if (typeof window === 'undefined') {
        return 0;
      }

      let total = 0;
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          total += window.localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  },
};

export default useLocalStorage;
