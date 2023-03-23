import { debounce } from 'lodash';
import React, { ReactElement, ReactNode, useCallback, useRef, useEffect, useState } from 'react';
import { Keyboard, PanResponder, NativeModules, DeviceEventEmitter, NativeEventEmitter } from 'react-native';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

const { PowerModule } = NativeModules;
const powerEventEmitter = new NativeEventEmitter(PowerModule)

interface DetectIdleLayerProps {
  children: ReactNode;
}

const ONE_MINUTE = 1000 * 60;
const UI_EXPIRY_TIME = ONE_MINUTE * 30;

export const DetectIdleLayer = ({ children }: DetectIdleLayerProps): ReactElement => {
  const [idle, setIdle] = useState(0);
  const [screenOffTime, setScreenOffTime] = useState<number>();
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

  const handleScreenOff = () => {
    setScreenOffTime(Date.now())
  }

  const handleScreenOn = () => {
    if (screenOffTime) {
      const timeDiff = Date.now() - screenOffTime;
      const newIdle = idle + timeDiff;
      setIdle(newIdle);
      setScreenOffTime(undefined)
      if (newIdle >= UI_EXPIRY_TIME) {
        handleIdleLogout();
      }
    }
  }

  useEffect(() => {
    let subscriptions = []
    if (signedIn) {
      subscriptions = [
        powerEventEmitter.addListener('screenOff', handleScreenOff),
        powerEventEmitter.addListener('screenOn', handleScreenOn),
        Keyboard.addListener('keyboardDidHide', handleResetIdle),
        Keyboard.addListener('keyboardDidShow', handleResetIdle),
      ]
    }
    return () => {
      subscriptions.forEach(subscription => subscription?.remove())
    };
  }, [screenOffTime, idle, signedIn]);

  useEffect(() => {
    PowerModule.addScreenOffListener();
    PowerModule.addScreenOnListener();
    
    return () => {
      PowerModule.removeScreenOffListener();
      PowerModule.removeScreenOnListener();
    } 
  },[])

  useEffect(() => {
    let intervalId: number;
    if (signedIn) {
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
