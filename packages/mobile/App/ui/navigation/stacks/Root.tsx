import { NavigationContainer, type NavigationContainerRef } from '@react-navigation/native';
import React, { type ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from '~/ui/contexts/SettingsContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { FacilityProvider } from '../../contexts/FacilityContext';
import { LocalisationProvider } from '../../contexts/LocalisationContext';
import { SelectedPatientProvider } from '../../contexts/SelectedPatientContext';
import { TranslationProvider } from '../../contexts/TranslationContext';
import { Core, type RootStackParamList } from './Core';
import DetectIdleLayer from './DetectIdleLayer';

const gestureHandlerRootViewStyle = { flex: 1 };

export const RootStack = (): ReactElement => {
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);
  return (
    <GestureHandlerRootView style={gestureHandlerRootViewStyle}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <LocalisationProvider>
            <TranslationProvider>
              <AuthProvider navRef={navigationRef}>
                <SettingsProvider>
                  <FacilityProvider>
                    <SelectedPatientProvider>
                      <DetectIdleLayer>
                        <Core />
                      </DetectIdleLayer>
                    </SelectedPatientProvider>
                  </FacilityProvider>
                </SettingsProvider>
              </AuthProvider>
            </TranslationProvider>
          </LocalisationProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
