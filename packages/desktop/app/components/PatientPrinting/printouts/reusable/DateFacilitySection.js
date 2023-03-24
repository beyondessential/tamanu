import React from 'react';
import styled from 'styled-components';

import { getCurrentDateString } from 'shared/utils/dateTime';

import { getFullLocationName } from '../../../../utils/location';
import { DateDisplay } from '../../../DateDisplay';

import { LocalisedLabel } from './SimplePrintout';
import { CertificateLabel } from './CertificateLabels';
import { CertificateLabel, LocalisedCertificateLabel } from './CertificateLabels';

const LocalisedLabel = styled(LocalisedCertificateLabel)`
  margin-bottom: 9px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 0 20px;
`;

export const DateFacilitySection = ({ encounter }) => {
  return (
    <RowContainer>
      <div>
        <CertificateLabel name="Print date" size="14px">
          <DateDisplay date={getCurrentDateString()} />
        </CertificateLabel>
      </div>
      <div>
        <LocalisedLabel name="facility" size="14px">
          {encounter?.location?.facility?.name}
        </LocalisedLabel>
      </div>
      <div>
        <LocalisedLabel name="locationId" size="14px">
          {getFullLocationName(encounter?.location)}
        </LocalisedLabel>
      </div>
    </RowContainer>
  );
};
