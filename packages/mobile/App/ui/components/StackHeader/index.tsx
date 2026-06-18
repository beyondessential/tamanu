import React, { ReactElement, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '/styled/theme';
import { StyledText } from '/styled/common';
import { ArrowLeftIcon, KebabIcon } from '../Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

const HEADER_HEIGHT = 70;
const BUTTON_PADDING = 25;

const stackHeaderStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  row: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.PRIMARY_MAIN,
  },
  sideButton: {
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
  subtitle: {
    fontSize: 11,
    color: theme.colors.WHITE,
    marginBottom: 2,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    color: theme.colors.WHITE,
    textAlign: 'center',
  },
});

type HeaderTitleProps = {
  title: ReactNode;
  subtitle?: ReactNode;
};

const HeaderTitle = ({ subtitle, title }: HeaderTitleProps): ReactElement => (
  <View style={stackHeaderStyles.titleOverlay} pointerEvents="none">
    {subtitle ? (
      typeof subtitle === 'string' ? (
        <Text style={stackHeaderStyles.subtitle}>{subtitle}</Text>
      ) : (
        <StyledText
          fontSize={11}
          color={theme.colors.WHITE}
          marginBottom={2}
          textAlign="center"
        >
          {subtitle}
        </StyledText>
      )
    ) : null}
    {typeof title === 'string' ? (
      <Text style={stackHeaderStyles.title}>{title}</Text>
    ) : (
      <StyledText color={theme.colors.WHITE} fontSize={16} textAlign="center">
        {title}
      </StyledText>
    )}
  </View>
);

type StackHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  onGoBack: () => void;
  onRightSideIconTap?: () => void;
};

export const StackHeader = ({
  title,
  subtitle,
  onGoBack,
  onRightSideIconTap,
}: StackHeaderProps): ReactElement => (
  <SafeAreaView style={stackHeaderStyles.safeArea} edges={['top']}>
    <View style={stackHeaderStyles.row}>
      <TouchableOpacity
        accessibilityLabel="back"
        style={stackHeaderStyles.sideButton}
        onPress={onGoBack}
      >
        <ArrowLeftIcon
          height={screenPercentageToDP(2.43, Orientation.Height)}
          width={screenPercentageToDP(2.43, Orientation.Height)}
        />
      </TouchableOpacity>
      {onRightSideIconTap ? (
        <TouchableOpacity
          accessibilityLabel="menu"
          style={[stackHeaderStyles.sideButton, { marginLeft: 'auto' }]}
          onPress={onRightSideIconTap}
        >
          <KebabIcon />
        </TouchableOpacity>
      ) : null}
      <HeaderTitle title={title} subtitle={subtitle} />
    </View>
  </SafeAreaView>
);

interface IEmptyStackHeader {
  title: string;
  onGoBack: () => void;
  status?: React.ReactNode;
}

const emptyStackHeaderStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.WHITE,
    borderColor: theme.colors.LIGHT_GREY,
  },
  backButton: {
    paddingTop: BUTTON_PADDING,
    paddingLeft: BUTTON_PADDING,
    paddingRight: BUTTON_PADDING,
    paddingBottom: BUTTON_PADDING,
  },
  row: {
    maxWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    paddingLeft: BUTTON_PADDING,
    paddingRight: BUTTON_PADDING,
    paddingBottom: BUTTON_PADDING,
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.TEXT_DARK,
    maxWidth: screenPercentageToDP(70, Orientation.Width),
  },
  statusContainer: {
    paddingRight: BUTTON_PADDING,
    paddingBottom: BUTTON_PADDING,
  },
});

export const EmptyStackHeader = ({ title, onGoBack, status }: IEmptyStackHeader): ReactElement => (
  <SafeAreaView style={emptyStackHeaderStyles.safeArea} edges={['top']}>
    <TouchableOpacity
      accessibilityLabel="back"
      style={emptyStackHeaderStyles.backButton}
      onPress={onGoBack}
    >
      <ArrowLeftIcon
        size={screenPercentageToDP(4.86, Orientation.Height)}
        fill={theme.colors.PRIMARY_MAIN}
      />
    </TouchableOpacity>

    <View style={emptyStackHeaderStyles.row}>
      <StyledText numberOfLines={2} style={emptyStackHeaderStyles.title}>
        {title}
      </StyledText>
      {status ? <View style={emptyStackHeaderStyles.statusContainer}>{status}</View> : null}
    </View>
  </SafeAreaView>
);
