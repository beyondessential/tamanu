import React, { ReactElement } from 'react';
import { theme } from '/styled/theme';
import {
  CenterView,
  StyledText,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  RowView,
} from '/styled/common';
import { ArrowLeftIcon, KebabIcon } from '../Icons';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type HeaderTitleProps = {
  title: string;
  subtitle: string;
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
  title: string;
  subtitle: string;
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
    <RowView background={theme.colors.PRIMARY_MAIN} height={70} justifyContent="space-between">
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
