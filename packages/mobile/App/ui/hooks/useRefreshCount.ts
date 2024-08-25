import { useCallback, useState } from 'react';

export const useRefreshCount = (): [number, () => void] => {
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const updateRefreshCount = useCallback(() => setRefreshCount(count => count + 1), [
    setRefreshCount,
  ]);
  return [refreshCount, updateRefreshCount];
};
