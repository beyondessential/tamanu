import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useOnForeground = () => {
  const [isForeground, setIsForeground] = useState(true);
  console.log('isForeground', isForeground);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('nextAppState', nextAppState);
      if (nextAppState === 'active') {
        console.log('changing to isForeground true');
        setIsForeground(true);
      } else {
        console.log('changing to isForeground false');
        setIsForeground(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return isForeground;
};
