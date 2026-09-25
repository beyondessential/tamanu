import React, { useCallback, useEffect, useEffectEvent, useRef } from 'react';
import { AppState, Keyboard } from 'react-native';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

/** 30 minutes */
const UI_EXPIRY_TIME = 1_800_000;

export default function DetectIdleLayer({ children }: Readonly<{ children: React.ReactNode }>) {
  const lastActivityRef = useRef(0);
  const { signOutClient, signedIn } = useAuth();

  /** Returns false so this view never claims the touch responder from its children */
  const recordActivity = useCallback((): boolean => {
    lastActivityRef.current = Date.now();
    return false;
  }, []);

  const signOutIfExpired = useEffectEvent((): void => {
    if (Date.now() - lastActivityRef.current >= UI_EXPIRY_TIME) signOutClient(true);
  });

  useEffect(() => {
    if (!signedIn) return;
    lastActivityRef.current = Date.now();

    // Timers are suspended while backgrounded, so also check on returning to the foreground
    const subscriptions = [
      AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') signOutIfExpired();
      }),
      Keyboard.addListener('keyboardDidHide', recordActivity),
      Keyboard.addListener('keyboardDidShow', recordActivity),
    ];
    const intervalId = setInterval(() => signOutIfExpired(), 60_000);

    return () => {
      clearInterval(intervalId);
      for (const subscription of subscriptions) subscription.remove();
    };
  }, [recordActivity, signedIn]);

  return (
    <StyledView
      height="100%"
      onStartShouldSetResponderCapture={recordActivity}
      onMoveShouldSetResponderCapture={recordActivity}
    >
      {children}
    </StyledView>
  );
}
