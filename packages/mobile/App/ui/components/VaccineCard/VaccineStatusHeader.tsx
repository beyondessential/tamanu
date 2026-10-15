import React from 'react';
import type { VaccineStatus } from '~/ui/helpers/patient';
import { VaccineStatusCells } from '/helpers/constants';
import { RowView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { StyledView } from '../../styled/common';

interface VaccineStatusProps {
  status: VaccineStatus;
}

export const VaccineStatusHeader = ({ status }: VaccineStatusProps) => {
  const { Icon: StatusIcon, color: statusColor, text: statusLabel } = VaccineStatusCells[status];
  return (
    <StyledView
      marginTop={10}
      paddingBottom={10}
      borderBottomWidth={4}
      borderColor={theme.colors.PRIMARY_MAIN}
    >
      <RowView background={theme.colors.WHITE} height={25} width="100%" justifyContent="center">
        <StatusIcon size={20} fill={statusColor} />
      </RowView>
      <RowView background={theme.colors.WHITE} justifyContent="center">
        <StyledText fontSize={13} color={theme.colors.MAIN_SUPER_DARK}>
          {statusLabel}
        </StyledText>
      </RowView>
    </StyledView>
  );
};
