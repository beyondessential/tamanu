import React, { PropsWithChildren } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  full: {
    flex: 1,
  },
});

export function KeyboardAwareView({
  children,
}: PropsWithChildren<{}>): JSX.Element {
  return (
    <KeyboardAwareScrollView
      scrollEnabled={false}
      contentContainerStyle={styles.full}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
