import React, { memo } from 'react';

import { RowView, StyledText } from '/styled/common';
import { VaccineStatusCells } from '/helpers/constants';
import { theme } from '/styled/theme';
import { VaccineStatus } from '~/ui/helpers/patient';
import { StyledView } from '../../styled/common';

interface VaccineStatusProps {
  status: VaccineStatus;
}

export const VaccineStatusHeader = ({ status }: VaccineStatusProps): JSX.Element => {
  const Icon = memo(() => {
    const VaccineIcon = VaccineStatusCells[status].Icon;
    return <VaccineIcon size={20} fill={VaccineStatusCells[status].color} />;
  });

  return (
    <StyledView
      marginTop={10}
      paddingBottom={10}
      borderBottomWidth={4}
      borderColor={theme.colors.PRIMARY_MAIN}
    >
      <RowView background={theme.colors.WHITE} height={25} width="100%" justifyContent="center">
        <Icon />
      </RowView>
      <RowView background={theme.colors.WHITE} justifyContent="center">
        <StyledText fontSize={13} color={theme.colors.MAIN_SUPER_DARK}>
          {VaccineStatusCells[status].text}
        </StyledText>
      </RowView>
    </StyledView>
  );
};
