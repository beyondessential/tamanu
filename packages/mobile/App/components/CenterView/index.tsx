import React, { PropsWithChildren } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function CenterView({ children }: PropsWithChildren<{}>) {
  return (
    <KeyboardAwareScrollView
      scrollEnabled={false}
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {children}
    </KeyboardAwareScrollView>
  );
}
