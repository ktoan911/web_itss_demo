import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, set] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => set(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
