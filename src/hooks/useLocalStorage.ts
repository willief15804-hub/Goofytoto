'use client';

import { useState, useEffect, useCallback } from 'react';
import { initializeData } from '@/lib/store';

export function useInitialize() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initializeData();
    setReady(true);
  }, []);
  return ready;
}

export function useForceUpdate() {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((t) => t + 1), []);
}
