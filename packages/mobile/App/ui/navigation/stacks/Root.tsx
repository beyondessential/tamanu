import React, { ReactElement } from 'react';
import { Root } from 'popup-ui';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store, persistor } from '../../store/index';
import { AuthProvider } from '../../contexts/AuthContext';
import { FacilityProvider } from '../../contexts/FacilityContext';
import { LocalisationProvider } from '../../contexts/LocalisationContext';
import { Core } from './Core';
import { DetectIdleLayer } from './DetectIdleLayer';

export const RootStack = (): ReactElement => {
  const navigationRef = React.useRef<NavigationContainerRef>(null);
  return (
    <SafeAreaProvider>
      <Root>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer ref={navigationRef}>
              <LocalisationProvider>
                <AuthProvider navRef={navigationRef}>
                  <FacilityProvider>
                    <DetectIdleLayer>
                      <Core />
                    </DetectIdleLayer>
                  </FacilityProvider>
                </AuthProvider>
              </LocalisationProvider>
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </Root>
    </SafeAreaProvider>
  );
};
