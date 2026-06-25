import { useCallback, useState } from 'react';

export const usePaginatedForm = () => {
  const [screenIndex, setScreenIndex] = useState(0);

  const onStepBack = useCallback(() => setScreenIndex(i => i - 1), []);
  const onStepForward = useCallback(() => setScreenIndex(i => i + 1), []);
  const handleStep = useCallback(step => () => setScreenIndex(step), []);

  return {
    onStepBack,
    onStepForward,
    handleStep,
    screenIndex,
    setScreenIndex,
  };
};
