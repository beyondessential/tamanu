import { debounce } from 'lodash-es';
import React, { ReactElement, ReactNode, useCallback, useEffect, useRef } from 'react';
import {
  AppState,
  AppStateStatus,
  EmitterSubscription,
  Keyboard,
  NativeEventSubscription,
  PanResponder,
} from 'react-native';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

interface DetectIdleLayerProps {
  children: ReactNode;
}

const ONE_MINUTE = 1000 * 60;
const UI_EXPIRY_TIME = ONE_MINUTE * 30;

export const DetectIdleLayer = ({ children }: DetectIdleLayerProps): ReactElement => {
  const lastActivityRef = useRef(Date.now());
  const screenOffTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const { signOutClient, signedIn } = useAuth();
  const signOutClientRef = useRef(signOutClient);
  signOutClientRef.current = signOutClient;

  const resetIdle = useCallback((): void => {
    lastActivityRef.current = Date.now();
  }, []);

  const debouncedResetIdle = useCallback(debounce(resetIdle, 300), [resetIdle]);

  const handleResetIdleRef = useRef((): boolean => {
    debouncedResetIdle();
    return false;
  });
  handleResetIdleRef.current = (): boolean => {
    debouncedResetIdle();
    return false;
  };

  const stableHandleResetIdle = useCallback(
    (): boolean => handleResetIdleRef.current(),
    [],
  );

  useEffect(() => {
    if (!signedIn) return;

    const handleStateChange = (nextAppState: AppStateStatus): void => {
      if (appStateRef.current === 'active' && nextAppState.match(/^(inactive|background)$/)) {
        screenOffTimeRef.current = Date.now();
      } else if (appStateRef.current.match(/^(inactive|background)$/) && nextAppState === 'active') {
        if (screenOffTimeRef.current) {
          screenOffTimeRef.current = null;
          if (Date.now() - lastActivityRef.current >= UI_EXPIRY_TIME) {
            signOutClientRef.current(true);
          }
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscriptions: (EmitterSubscription | NativeEventSubscription)[] = [
      AppState.addEventListener('change', handleStateChange),
      Keyboard.addListener('keyboardDidHide', stableHandleResetIdle),
      Keyboard.addListener('keyboardDidShow', stableHandleResetIdle),
    ];

    const intervalId = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= UI_EXPIRY_TIME) {
        signOutClientRef.current(true);
      }
    }, ONE_MINUTE);

    return () => {
      clearInterval(intervalId);
      subscriptions.forEach(subscription => subscription?.remove());
      debouncedResetIdle.cancel();
    };
  }, [signedIn, stableHandleResetIdle, debouncedResetIdle]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: stableHandleResetIdle,
      onStartShouldSetPanResponderCapture: stableHandleResetIdle,
      onPanResponderTerminationRequest: stableHandleResetIdle,
    }),
  );

  return (
    <StyledView height="100%" {...panResponder.current.panHandlers}>
      {children}
    </StyledView>
  );
};
