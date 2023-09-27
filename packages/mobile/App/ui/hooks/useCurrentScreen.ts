import { useState } from 'react';

export const useCurrentScreen = () => {
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  const onNavigatePrevious = (): void => {
    setCurrentScreenIndex(Math.max(currentScreenIndex - 1, 0));
  };

  return {
    currentScreenIndex,
    onNavigatePrevious,
    setCurrentScreenIndex,
  };
};
