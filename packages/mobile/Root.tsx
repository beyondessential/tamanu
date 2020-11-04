import React, { useCallback, useEffect, useState } from 'react';
import { DevSettings } from 'react-native';
import Storybook from './storybook';
import { App } from './App';

export const Root = (): any => {
  const [storybookActive, setStorybookActive] = useState(false);
  const toggleStorybook = useCallback(
    () => setStorybookActive(active => !active),
    [],
  );

  useEffect(() => {
    if (__DEV__) {
      DevSettings.addMenuItem('Toggle Storybook', toggleStorybook);
    }
  }, [toggleStorybook]);

  return storybookActive ? <Storybook /> : <App />;
};
