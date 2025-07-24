import { useState, useEffect } from 'react';

/**
 * useDebounce - 値の変更を遅延させるフック
 * @param value - デバウンスする値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback - コールバック関数をデバウンスするフック
 * @param callback - デバウンスするコールバック関数
 * @param delay - 遅延時間（ミリ秒）
 * @param deps - 依存配列
 * @returns デバウンスされたコールバック関数
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(() => callback);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay, ...deps]);

  return debouncedCallback;
}

/**
 * useThrottle - 値の変更を制限するフック
 * @param value - スロットルする値
 * @param limit - 制限時間（ミリ秒）
 * @returns スロットルされた値
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastRun, setLastRun] = useState<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun >= limit) {
        setThrottledValue(value);
        setLastRun(Date.now());
      }
    }, limit - (Date.now() - lastRun));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit, lastRun]);

  return throttledValue;
}

/**
 * useSearch - 検索用のデバウンスフック
 * @param searchTerm - 検索語
 * @param delay - 遅延時間（デフォルト: 300ms）
 * @returns デバウンスされた検索語
 */
export function useSearch(searchTerm: string, delay: number = 300): string {
  return useDebounce(searchTerm, delay);
}

/**
 * useDelayedLoading - ローディング状態を遅延表示するフック
 * @param isLoading - ローディング状態
 * @param delay - 遅延時間（デフォルト: 200ms）
 * @returns 遅延されたローディング状態
 */
export function useDelayedLoading(isLoading: boolean, delay: number = 200): boolean {
  const [delayedLoading, setDelayedLoading] = useState<boolean>(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      timeoutId = setTimeout(() => {
        setDelayedLoading(true);
      }, delay);
    } else {
      setDelayedLoading(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, delay]);

  return delayedLoading;
}

export default useDebounce;
