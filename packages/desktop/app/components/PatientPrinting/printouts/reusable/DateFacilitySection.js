import React from 'react';
import styled from 'styled-components';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { getFullLocationName } from '../../../../utils/location';
import { DateDisplay } from '../../../DateDisplay';

import { CertificateLabel, LocalisedCertificateLabel } from './CertificateLabels';

const RowContainer = styled.div`
  display: flex;
  justify-content: start;
  flex-wrap: wrap;
  padding: 0 20px;
`;

const Item = styled.div`
  margin-right: 36px;
  p {
    margin-bottom: 0px;
  }
`;

export const DateFacilitySection = ({ encounter }) => {
  return (
    <RowContainer>
      <Item>
        <CertificateLabel name="Print date" size="14px">
          <DateDisplay date={getCurrentDateString()} />
        </CertificateLabel>
      </Item>
      <Item>
        <LocalisedCertificateLabel name="facility" size="14px">
          {encounter?.location?.facility?.name}
        </LocalisedCertificateLabel>
      </Item>
      <Item>
        <LocalisedCertificateLabel name="locationId" size="14px">
          {getFullLocationName(encounter?.location)}
        </LocalisedCertificateLabel>
      </Item>
    </RowContainer>
  );
};
