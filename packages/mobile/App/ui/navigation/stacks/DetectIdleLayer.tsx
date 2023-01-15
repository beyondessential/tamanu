import { debounce } from 'lodash';
import React, { ReactElement, ReactNode, useCallback, useRef, useEffect, useState } from 'react';
import { Keyboard, PanResponder } from 'react-native';
import { useSelector } from 'react-redux';
import { authSignedInSelector } from '~/ui/helpers/selectors';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

interface DetectIdleLayerProps {
  children: ReactNode;

}

const UI_EXPIRY_TIME = 1000 * 60 * 30; // 30 minutes

export const DetectIdleLayer = ({ children }: DetectIdleLayerProps): ReactElement => {
  const [idle, setIdle] = useState(0);
  const signedIn = useSelector(authSignedInSelector);
  const { signOutClient } = useAuth();

  const resetIdle = (): void => {
    setIdle(0);
  };

  const debouncedResetIdle = useCallback(
    debounce(resetIdle, 300),
    [],
  );

  const handleResetIdle = (): boolean => {
    if (signedIn) {
      debouncedResetIdle();
    }
    return false;
  };

  const handleIdleLogout = (): void => {
    signOutClient(true);
  };

  useEffect(() => {
    let hideEvent;
    let showEvent;
    if (signedIn) {
      hideEvent = Keyboard.addListener('keyboardDidHide', handleResetIdle);
      showEvent = Keyboard.addListener('keyboardDidShow', handleResetIdle);
    } else {
      // Removing listeners on logout
      hideEvent?.remove();
      showEvent?.remove();
    }
    return () => {
      hideEvent?.remove();
      showEvent?.remove();
    };
  }, [signedIn]);

  useEffect(() => {
    let timer;
    if (signedIn) {
      timer = setInterval(() => {
        if (idle > UI_EXPIRY_TIME) {
          handleIdleLogout();
        }
        setIdle(idle + 1000);
        console.log('idle timer (ms):', idle);
      }, 1000);
    } else {
      // Removing listeners and resetting idle timer on logout
      setIdle(0);
      clearInterval(timer);
    }
    return () => {
      clearInterval(timer);
    };
  }, [idle, signedIn]);

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
