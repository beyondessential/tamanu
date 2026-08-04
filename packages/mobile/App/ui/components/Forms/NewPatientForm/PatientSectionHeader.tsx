import React, { ReactElement } from 'react';
import { SectionHeader } from '../../SectionHeader';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';

export const PatientSectionHeader = ({ name }): ReactElement => {
  return (
    <StyledView
      paddingTop={20}
      paddingBottom={20}
      borderColor={theme.colors.PRIMARY_MAIN}
      background={theme.colors.WHITE}
    >
      <SectionHeader h1 marginLeft={20}>
        {name}
      </SectionHeader>
    </StyledView>
  );
};
