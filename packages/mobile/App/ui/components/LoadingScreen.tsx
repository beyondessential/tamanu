import React from 'react';
import { ActivityIndicator } from 'react-native';
import { CenterView, FullView } from '~/ui/styled/common';

export const LoadingScreen = () => (
  <FullView padding={12} justifyContent="center" alignItems="center">
    <CenterView>
      <ActivityIndicator size="large" />
    </CenterView>
  </FullView>
);
