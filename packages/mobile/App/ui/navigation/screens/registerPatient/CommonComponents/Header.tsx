import React, { ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '/styled/theme';
import { StyledText } from '/styled/common';
import { ArrowLeftIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const BUTTON_PADDING = screenPercentageToDP(2.46, Orientation.Height);
const HEADER_HEIGHT = 70;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  backButton: {
    padding: BUTTON_PADDING,
    zIndex: 1,
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: BUTTON_PADDING + 28,
  },
});

type HeaderProps = {
  onGoBack: () => void;
};

export const Header = ({ onGoBack }: HeaderProps): ReactElement => (
  <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.row}>
      <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
        <ArrowLeftIcon
          height={screenPercentageToDP(2.43, Orientation.Height)}
          width={screenPercentageToDP(2.43, Orientation.Height)}
          fill="white"
        />
      </TouchableOpacity>
      <View style={styles.titleOverlay} pointerEvents="none">
        <StyledText color={theme.colors.WHITE} fontSize={16} textAlign="center">
          <TranslatedText stringId="patient.register.title" fallback="Register New Patient" />
        </StyledText>
      </View>
    </View>
  </SafeAreaView>
);
