import { useState, useEffect } from 'react';
import type { FishboneData } from '../types/fishbone';

const STORAGE_KEY = 'fishbone-studio-data';

/**
 * Persists FishboneData to localStorage automatically.
 * Falls back to `defaultData` if nothing is stored yet.
 */
export function useLocalPersistence(defaultData: FishboneData) {
  const [data, setData] = useState<FishboneData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as FishboneData;
    } catch {
      // corrupt data — fall through to default
    }
    return defaultData;
  });

  // Save on every change (debounce handled by caller if needed)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.warn('localStorage write failed');
    }
  }, [data]);

  return [data, setData] as const;
}
