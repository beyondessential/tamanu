import { debounce } from 'lodash';
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useState,
  ReactChildren,
} from 'react';
import { Keyboard, PanResponder } from 'react-native';
import { useSelector } from 'react-redux';
import { authSignedInSelector } from '~/ui/helpers/selectors';
import { StyledView } from '~/ui/styled/common';
import { useAuth } from '../../contexts/AuthContext';

interface DetectIdleLayerProps {
  children: ReactNode;
}

const ONE_MINUTE = 1000 * 60;
const UI_EXPIRY_TIME = ONE_MINUTE * 30;

export const PanResponderView = ({ children }: DetectIdleLayerProps): ReactElement => {
  const [idle, setIdle] = useState(0);
  const { signOutClient } = useAuth();

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
    let hideEvent;
    let showEvent;
    hideEvent = Keyboard.addListener('keyboardDidHide', handleResetIdle);
    showEvent = Keyboard.addListener('keyboardDidShow', handleResetIdle);
    return () => {
      hideEvent?.remove();
      showEvent?.remove();
    };
  }, []);

  useEffect(() => {
    let timer;
    timer = setInterval(() => {
      const newIdle = idle + ONE_MINUTE;
      setIdle(newIdle);
      if (newIdle >= UI_EXPIRY_TIME) {
        handleIdleLogout();
      }
    }, ONE_MINUTE);
    return () => {
      clearInterval(timer);
    };
  }, [idle]);

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

export const DetectIdleLayer = ({ children }: DetectIdleLayerProps): ReactElement => {
  const signedIn = useSelector(authSignedInSelector);
  return signedIn ? (
    <PanResponderView>{children}</PanResponderView>
  ) : (
    <StyledView height="100%">{children}</StyledView>
  );
};
