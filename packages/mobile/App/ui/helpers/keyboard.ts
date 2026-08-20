import { useEffect } from 'react';
import { Keyboard, KeyboardEventName } from 'react-native';

export const keyboardListener = (event: KeyboardEventName, callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener(event, callback);
    return (): void => {
      keyboardEventListener.remove();
    };
  }, []);
};

export const onKeyboardCloseListener = (callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener('keyboardDidHide', callback);
    return (): void => {
      keyboardEventListener.remove();
    };
  }, []);
};

export const onKeyboardOpenListener = (callback: () => void): void => {
  useEffect(() => {
    const keyboardEventListener = Keyboard.addListener('keyboardDidShow', callback);
    return (): void => {
      keyboardEventListener.remove();
    };
  }, []);
};
