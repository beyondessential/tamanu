import React, { ReactElement, FC } from 'react';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

type ModalFieldProps = {
  label: string;
  value: string;
  Icon?: FC<any>;
};

export const ModalField: FC<ModalFieldProps> = ({
  label,
  value,
  Icon,
}: ModalFieldProps) => (
  <RowView
    height={screenPercentageToDP(6.68, Orientation.Height)}
    alignItems="center"
    justifyContent="space-between"
    paddingLeft={screenPercentageToDP('2.43', Orientation.Height)}
    paddingRight={screenPercentageToDP('2.43', Orientation.Height)}
  >
    <StyledView left="8%" top="15%" position="absolute">
      <StyledText
        color={theme.colors.TEXT_MID}
        fontSize={screenPercentageToDP(1.21, Orientation.Height)}
      >
        {label}
      </StyledText>
    </StyledView>
    <StyledText
      marginTop={15}
      color={theme.colors.TEXT_DARK}
      fontSize={screenPercentageToDP(2.18, Orientation.Height)}
    >
      {value}
    </StyledText>
    {Icon && <Icon size={16} />}
  </RowView>
);
