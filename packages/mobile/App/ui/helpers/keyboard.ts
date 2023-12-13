import { useEffect } from 'react';
import { Keyboard, KeyboardEventName, Platform } from 'react-native';

export const keyboardListener = (
  event: KeyboardEventName,
  callback: () => void,
): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(event, callback);
    return (): void => {
      keyboardEventListener.remove();
    };
  }, []);
};

export const onKeyboardCloseListener = (callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      callback,
    );
    return (): void => {
      keyboardEventListener.remove();
    };
  }, []);
};

export const onKeyboardOpenListener = (callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      callback,
    );
    return (): void => {
      keyboardEventListener.remove();
    };
  }, []);
};
