import { useCallback, useState } from 'react';

export const useRefreshCount = () => {
  const [refreshCount, setRefreshCount] = useState(0);
  const updateRefreshCount = useCallback(() => setRefreshCount(count => count + 1), [
    setRefreshCount,
  ]);
  return [refreshCount, updateRefreshCount];
};
