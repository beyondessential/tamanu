import React from 'react';
import { RowView, StyledText } from '/styled/common';
import { VaccineIcons } from '/helpers/constants';
import { theme } from '/styled/theme';

interface VaccineStatusProps {
  status: string;
}

export const VaccineStatusHeader = ({
  status,
}: VaccineStatusProps): JSX.Element => {
  const Icon = VaccineIcons[status].Icon;
  return (
    <RowView
      background={VaccineIcons[status].color}
      paddingLeft={20}
      height={45}
      alignItems="center"
    >
      <Icon
        height={20}
        width={20}
        fill={theme.colors.WHITE}
        background={VaccineIcons[status].color}
      />
      <StyledText
        fontWeight={500}
        marginLeft={10}
        fontSize={13}
        color={theme.colors.WHITE}
      >
        {VaccineIcons[status].text}
      </StyledText>
    </RowView>
  );
};
