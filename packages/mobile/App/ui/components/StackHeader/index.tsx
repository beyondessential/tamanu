import React, { ReactElement } from 'react';
import { theme } from '/styled/theme';
import {
  CenterView,
  StyledText,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  RowView,
} from '/styled/common';
import { ArrowLeftIcon } from '../Icons';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type HeaderTitleProps = {
  title: string;
  subtitle: string;
};

const HeaderTitle = ({ subtitle, title }: HeaderTitleProps): ReactElement => (
  <CenterView top="25%" position="absolute" zIndex={-1} width="100%">
    <StyledText fontSize={11} color={theme.colors.WHITE}>
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
};

export const StackHeader = ({
  title,
  subtitle,
  onGoBack,
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
      <HeaderTitle title={title} subtitle={subtitle} />
    </RowView>
  </StyledSafeAreaView>
);
