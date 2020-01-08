import React, { PropsWithChildren } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  centerStyles: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export function CenterView({ children }: PropsWithChildren<{}>): JSX.Element {
  return (
    <KeyboardAwareScrollView
      scrollEnabled={false}
      contentContainerStyle={styles.centerStyles}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
