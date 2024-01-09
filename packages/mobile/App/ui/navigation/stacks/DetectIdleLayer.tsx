import { debounce } from 'lodash';
import React, { ReactElement, ReactNode, useCallback, useRef, useEffect, useState } from 'react';
import {
  Keyboard,
  PanResponder,
  EmitterSubscription,
  AppState,
  NativeEventSubscription,
  AppStateStatus,
} from 'react-native';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

interface DetectIdleLayerProps {
  children: ReactNode;
}

const ONE_MINUTE = 1000 * 60;
const UI_EXPIRY_TIME = ONE_MINUTE * 30;

export const DetectIdleLayer = ({ children }: DetectIdleLayerProps): ReactElement => {
  const [idle, setIdle] = useState(0);
  const [screenOffTime, setScreenOffTime] = useState<number|null>(null);
  const appState = useRef(AppState.currentState);
  const { signOutClient, signedIn } = useAuth();

  const resetIdle = (): void => {
    setIdle(0);
  };

  const debouncedResetIdle = useCallback(debounce(resetIdle, 300), []);

  const handleResetIdle = (): boolean => {
    debouncedResetIdle();
    // Returns false to indicate that this component
    // shouldn't block native components from becoming the JS responder
    return false;
  };

  const handleIdleLogout = (): void => {
    signOutClient(true);
  };

  const handleStateChange = (nextAppState: AppStateStatus): void => {
    if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      // App has moved to the background
      setScreenOffTime(Date.now());
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has moved to the foreground
      if (screenOffTime) {
        const timeDiff = Date.now() - screenOffTime;
        const newIdle = idle + timeDiff;
        setIdle(newIdle);
        setScreenOffTime(null);
        if (newIdle >= UI_EXPIRY_TIME) {
          handleIdleLogout();
        }
      }
    }
    appState.current = nextAppState;
  };

  useEffect(() => {
    let intervalId: NodeJS.Timer;
    let subscriptions: (EmitterSubscription|NativeEventSubscription)[] = [];
    if (signedIn) {
      subscriptions = [
        AppState.addEventListener('change', handleStateChange),
        Keyboard.addListener('keyboardDidHide', handleResetIdle),
        Keyboard.addListener('keyboardDidShow', handleResetIdle),
      ];
      intervalId = setInterval(() => {
        const newIdle = idle + ONE_MINUTE;
        setIdle(newIdle);
        if (newIdle >= UI_EXPIRY_TIME) {
          handleIdleLogout();
        }
      }, ONE_MINUTE);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      subscriptions.forEach(subscription => subscription?.remove());
    };
  }, [idle, signedIn, screenOffTime]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: handleResetIdle,
      onStartShouldSetPanResponderCapture: handleResetIdle,
      onPanResponderTerminationRequest: handleResetIdle,
    }),
  );

  return (
    <StyledView height="100%" {...panResponder.current.panHandlers}>
      {children}
    </StyledView>
  );
};
