import { useRef, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useOnForeground = () => {
  const [isForeground, setIsForeground] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        setIsForeground(true);
      } else {
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
