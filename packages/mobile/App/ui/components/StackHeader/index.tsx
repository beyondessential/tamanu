import React, { ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { theme } from '/styled/theme';
import {
  CenterView,
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
} from '/styled/common';
import { ArrowLeftIcon, KebabIcon } from '../Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

type HeaderTitleProps = {
  title: Element;
  subtitle: Element;
};

const HeaderTitle = ({ subtitle, title }: HeaderTitleProps): ReactElement => (
  <CenterView top="25%" position="absolute" zIndex={-1} width="100%">
    <StyledText fontSize={11} color={theme.colors.WHITE} marginBottom={2} marginTop={-2}>
      {subtitle}
    </StyledText>
    <StyledText color={theme.colors.WHITE} fontSize={16}>
      {title}
    </StyledText>
  </CenterView>
);

type StackHeaderProps = {
  title: Element;
  subtitle: Element;
  onGoBack: () => void;
  onRightSideIconTap?: () => void;
};

export const StackHeader = ({
  title,
  subtitle,
  onGoBack,
  onRightSideIconTap,
}: StackHeaderProps): ReactElement => (
  <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
    <RowView background={theme.colors.PRIMARY_MAIN} height={70}>
      <StyledTouchableOpacity
        accessibilityLabel="back"
        paddingTop={25}
        paddingLeft={25}
        paddingRight={25}
        paddingBottom={25}
        onPress={onGoBack}
      >
        <ArrowLeftIcon
          height={screenPercentageToDP(2.43, Orientation.Height)}
          width={screenPercentageToDP(2.43, Orientation.Height)}
        />
      </StyledTouchableOpacity>
      {onRightSideIconTap && (
        <StyledTouchableOpacity
          accessibilityLabel="menu"
          paddingTop={25}
          paddingLeft={25}
          paddingRight={25}
          paddingBottom={25}
          onPress={onRightSideIconTap}
        >
          <KebabIcon />
        </StyledTouchableOpacity>
      )}
      <HeaderTitle title={title} subtitle={subtitle} />
    </RowView>
  </StyledSafeAreaView>
);

interface IEmptyStackHeader {
  title: string;
  onGoBack: () => void;
  status?: React.ReactNode;
}

const HEADER_PADDING = 25;

const emptyStackHeaderStyles = StyleSheet.create({
  backButton: {
    paddingTop: HEADER_PADDING,
    paddingLeft: HEADER_PADDING,
    paddingRight: HEADER_PADDING,
    paddingBottom: HEADER_PADDING,
  },
  row: {
    maxWidth: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    paddingLeft: HEADER_PADDING,
    paddingRight: HEADER_PADDING,
    paddingBottom: HEADER_PADDING,
    fontSize: 24,
    fontWeight: '500',
    color: theme.colors.TEXT_DARK,
    maxWidth: screenPercentageToDP(70, Orientation.Width),
  },
  statusContainer: {
    paddingRight: HEADER_PADDING,
    paddingBottom: HEADER_PADDING,
  },
});

export const EmptyStackHeader = ({ title, onGoBack, status }: IEmptyStackHeader): ReactElement => (
  <StyledSafeAreaView background={theme.colors.WHITE} borderColor={theme.colors.LIGHT_GREY}>
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
  </StyledSafeAreaView>
);
