import React, { Ref, PropsWithChildren, ReactElement } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { FullView } from '/styled/common';
import { ScrollView } from 'react-native-gesture-handler';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyle: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
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
  <FullView background={theme.colors.BACKGROUND_GREY}>
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.KeyboardAvoidingViewStyle}
      contentContainerStyle={styles.KeyboardAvoidingViewContainer}
    >
      <ScrollView
        style={styles.ScrollView}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        scrollToOverflowEnabled
        overScrollMode="always"
      >
        <FullView margin={screenPercentageToDP(4.86, Orientation.Width)}>
          {children}
        </FullView>
      </ScrollView>
    </KeyboardAvoidingView>
  </FullView>
);
