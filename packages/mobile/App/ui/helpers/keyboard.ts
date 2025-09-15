import { useEffect } from 'react';
import { Keyboard, KeyboardEventName, Platform } from 'react-native';

export const useKeyboardListener = (event: KeyboardEventName, callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(event, callback);
    return (): void => {
      keyboardEventListener.remove();
    };
  }, [callback, event]);
};

export const useKeyboardCloseListener = (callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
      callback,
    );
    return (): void => {
      keyboardEventListener.remove();
    };
  }, [callback]);
};

export const useKeyboardOpenListener = (callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(
      Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
      callback,
    );
    return (): void => {
      keyboardEventListener.remove();
    };
  }, [callback]);
};
