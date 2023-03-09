import { debounce } from 'lodash';
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useState,
} from 'react';
import { Keyboard, PanResponder } from 'react-native';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

interface DetectIdleLayerProps {
  children: ReactNode;
}

const ONE_MINUTE = 1000 * 60;
const UI_EXPIRY_TIME = ONE_MINUTE * 30;

export const DetectIdleLayer = ({ children }: DetectIdleLayerProps): ReactElement => {
  const [idle, setIdle] = useState(0);
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

  useEffect(() => {
    const hideEvent = Keyboard.addListener('keyboardDidHide', handleResetIdle);
    const showEvent = Keyboard.addListener('keyboardDidShow', handleResetIdle);
    return () => {
      hideEvent?.remove();
      showEvent?.remove();
    };
  }, []);

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
