import React, { type PropsWithChildren, type ReactElement, type Ref } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyle: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
  },
  ScrollView: { flex: 1 },
});

type FormScreenViewProps = {
  scrollViewRef: Ref<any>;
};

export const FormScreenView = ({
  children,
  scrollViewRef,
}: PropsWithChildren<FormScreenViewProps>): ReactElement => (
  <StyledSafeAreaView flex={1} background={theme.colors.BACKGROUND_GREY}>
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.KeyboardAvoidingViewStyle}
      contentContainerStyle={styles.KeyboardAvoidingViewContainer}
    >
      <ScrollView
        style={styles.ScrollView}
        ref={scrollViewRef}
        scrollToOverflowEnabled
        overScrollMode="always"
      >
        <FullView margin={screenPercentageToDP(4.86, Orientation.Width)}>{children}</FullView>
      </ScrollView>
    </KeyboardAvoidingView>
  </StyledSafeAreaView>
);
