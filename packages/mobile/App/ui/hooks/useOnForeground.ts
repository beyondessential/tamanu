import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useOnForeground = () => {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        setIsForeground(true);
      } else {
        setIsForeground(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return isForeground;
};
