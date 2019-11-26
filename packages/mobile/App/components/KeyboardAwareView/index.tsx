import React, { PropsWithChildren } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export function KeyboardAwareView({ children }: PropsWithChildren<{}>) {
  return (
    <KeyboardAwareScrollView
      scrollEnabled={false}
      contentContainerStyle={{
        flex: 1,
      }}>
      {children}
    </KeyboardAwareScrollView>
  );
}
