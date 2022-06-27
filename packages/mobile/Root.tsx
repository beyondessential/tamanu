import React, { useCallback, useEffect, useState } from 'react';
import { DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Storybook from './storybook';
import { App } from './App';

const setPersistedStorybookActive = async (storybookActive): Promise<void> => {
  AsyncStorage.setItem('storybookActive', storybookActive ? 'true' : 'false');
};

export const Root = (): any => {
  const [storybookActive, setStorybookActive] = useState(false);

  const toggleStorybook = useCallback(
    () => {
      setPersistedStorybookActive(!storybookActive);
      setStorybookActive(!storybookActive);
    },
    [storybookActive],
  );

  // read value from local storage so that storybook toggle persists through reloads
  useEffect(() => {
    const getPersistedStorybookActive = async (): Promise<void> => {
      const value = await AsyncStorage.getItem('storybookActive');
      setStorybookActive(value === 'true');
    };
    getPersistedStorybookActive();
  }, [storybookActive]);

  useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem('Toggle Storybook', toggleStorybook);
    }
  }, [toggleStorybook]);

  return storybookActive ? <Storybook /> : <App />;
};
