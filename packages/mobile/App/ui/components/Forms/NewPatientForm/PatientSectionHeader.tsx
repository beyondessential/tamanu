import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const PatientSectionHeader = ({ name }): ReactElement => {
  return (
    <StyledView
      paddingTop={20}
      paddingBottom={20}
      borderColor={theme.colors.PRIMARY_MAIN}
      background={theme.colors.WHITE}
    >
      <RowView width="100%">{name}</RowView>
    </StyledView>
  );
};
