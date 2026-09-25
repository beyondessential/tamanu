import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SettingsProvider } from '~/ui/contexts/SettingsContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { FacilityProvider } from '../../contexts/FacilityContext';
import { LocalisationProvider } from '../../contexts/LocalisationContext';
import { TranslationProvider } from '../../contexts/TranslationContext';
import { persistor, store } from '../../store/index';
import { Core, type RootStackParamList } from './Core';
import DetectIdleLayer from './DetectIdleLayer';

const gestureHandlerRootViewStyle = { flex: 1 };

export const RootStack = (): ReactElement => {
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);
  return (
    <GestureHandlerRootView style={gestureHandlerRootViewStyle}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer ref={navigationRef}>
              <LocalisationProvider>
                <TranslationProvider>
                  <AuthProvider navRef={navigationRef}>
                    <SettingsProvider>
                      <FacilityProvider>
                        <DetectIdleLayer>
                          <Core />
                        </DetectIdleLayer>
                      </FacilityProvider>
                    </SettingsProvider>
                  </AuthProvider>
                </TranslationProvider>
              </LocalisationProvider>
            </NavigationContainer>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
