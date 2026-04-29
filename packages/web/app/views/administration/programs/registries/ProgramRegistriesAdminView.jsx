import React from 'react';

import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import styled from 'styled-components';
import { AdminViewContainer, TitleContainer } from '../../components/AdminViewContainer';
import { ManageProgramRegistriesAdminView } from './ManageProgramRegistriesAdminView';

const StyledAdminViewContainer = styled(AdminViewContainer)`
  ${TitleContainer} {
    border-block-end: 1px solid ${TAMANU_COLORS.outline};
  }
`;

export const ProgramRegistriesAdminView = () => {
  return (
    <StyledAdminViewContainer
      title={
        <TranslatedText stringId="admin.programRegistries.title" fallback="Program registries" />
      }
    >
      <ManageProgramRegistriesAdminView />
    </StyledAdminViewContainer>
  );
};
