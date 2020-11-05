import React, { useCallback, useEffect, useState } from 'react';
import { DevSettings } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import Storybook from './storybook';
import { App } from './App';

const storeValue = async (value: boolean): Promise<void> => AsyncStorage.setItem('storybookActive', value ? 'true' : 'false');

export const Root = (): any => {
  const [storybookActive, setStorybookActive] = useState(false);
  const toggleStorybook = useCallback(
    () => {
      const newValue = !storybookActive;
      storeValue(newValue);
      setStorybookActive(newValue);
    },
    [],
  );

  useEffect(() => {
    // read value from local storage so that storybook toggle persists through reloads
    const setInitialStorybookActive = async (): Promise<void> => {
      const value = await AsyncStorage.getItem('storybookActive');
      setStorybookActive(value === 'true');
    };
    setInitialStorybookActive();
  });

  useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem('Toggle Storybook', toggleStorybook);
    }
  }, [toggleStorybook]);

  return storybookActive ? <Storybook /> : <App />;
};
