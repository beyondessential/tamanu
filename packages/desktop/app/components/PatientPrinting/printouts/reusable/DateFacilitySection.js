import React from 'react';
import styled from 'styled-components';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { useAuth } from '../../../../contexts/Auth';
import { getFullLocationName } from '../../../../utils/location';
import { DateDisplay } from '../../../DateDisplay';

import { LocalisedLabel } from './SimplePrintout';
import { CertificateLabel } from './CertificateLabels';

const RowContainer = styled.div`
  display: flex;
  justify-content: space-around;
`;

const StyledDiv = styled.div`
  ${props => (props.$marginLeft ? `margin-left: ${props.$marginLeft}px;` : '')}
`;

export const DateFacilitySection = ({ encounter }) => {
  const { facility } = useAuth();
  return (
    <RowContainer>
      <StyledDiv>
        <CertificateLabel name="Print date" size="14px">
          <DateDisplay date={getCurrentDateString()} />
        </CertificateLabel>
      </StyledDiv>
      <StyledDiv>
        <LocalisedLabel name="facility" size="14px">
          {facility.name}
        </LocalisedLabel>
      </StyledDiv>
      <StyledDiv>
        <LocalisedLabel name="locationId" size="14px">
          {getFullLocationName(encounter?.location)}
        </LocalisedLabel>
      </StyledDiv>
    </RowContainer>
  );
};
