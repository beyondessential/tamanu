import React, { ReactElement } from 'react';
import { RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { SectionHeader } from '~/ui/components/SectionHeader';

export const PatientSectionHeader = ({ name }): ReactElement => {
  return (
    <StyledView
      paddingTop={20}
      paddingBottom={20}
      borderColor={theme.colors.PRIMARY_MAIN}
      background={theme.colors.WHITE}
    >
      <RowView background={theme.colors.WHITE} height={25} width="100%">
        <SectionHeader h1 fontSize={20} marginLeft={20}>
          {name}
        </SectionHeader>
      </RowView>
    </StyledView>
  );
};
