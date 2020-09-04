import React, { memo } from 'react';
import { RowView, StyledText } from '/styled/common';
import { VaccineIcons } from '/helpers/constants';
import { theme } from '/styled/theme';

interface VaccineStatusProps {
  status: string;
}

export const VaccineStatusHeader = ({
  status,
}: VaccineStatusProps): JSX.Element => {
  const Icon = memo(() => {
    const VaccineIcon = VaccineIcons[status].Icon;
    return (
      <VaccineIcon
        size={20}
        fill={VaccineIcons[status].color}
        background={theme.colors.WHITE}
      />
    );
  });

  return (
    <RowView
      background={VaccineIcons[status].color}
      paddingLeft={20}
      height={45}
      alignItems="center"
    >
      <Icon />
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
