import React, { memo } from 'react';
import { RowView, StyledText } from '/styled/common';
import { VaccineStatusCells } from '/helpers/constants';
import { theme } from '/styled/theme';
import { VaccineStatus } from '~/ui/helpers/patient';

interface VaccineStatusProps {
  status: VaccineStatus;
}

export const VaccineStatusHeader = ({
  status,
}: VaccineStatusProps): JSX.Element => {
  const Icon = memo(() => {
    const VaccineIcon = VaccineStatusCells[status].Icon;
    return (
      <VaccineIcon
        size={20}
        fill={VaccineStatusCells[status].color}
        background={theme.colors.WHITE}
      />
    );
  });

  return (
    <RowView
      background={VaccineStatusCells[status].color}
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
        {VaccineStatusCells[status].text}
      </StyledText>
    </RowView>
  );
};
