import { useRef, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useOnForeground = () => {
  const [isForeground, setIsForeground] = useState(true);
  const appState = useRef(AppState.currentState);
  console.log('isForeground', isForeground);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('changing to isForeground true');
        setIsForeground(true);
      } else {
        console.log('changing to isForeground false');
        setIsForeground(false);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return isForeground;
};
