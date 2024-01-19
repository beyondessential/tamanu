import React from 'react';
import styled from 'styled-components';

import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';

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
`;

const LocalisedLabel = styled(LocalisedCertificateLabel)`
  font-size: 14px;
  margin-bottom: 0px;
`;

const Label = styled(CertificateLabel)`
  font-size: 14px;
  margin-bottom: 0px;
`;

export const DateFacilitySection = ({ encounter }) => {
  return (
    <RowContainer>
      <Item>
        <Label name="Print date">
          <DateDisplay date={getCurrentDateString()} />
        </Label>
      </Item>
      <Item>
        <LocalisedLabel name="facility">{encounter?.location?.facility?.name}</LocalisedLabel>
      </Item>
      <Item>
        <LocalisedLabel name="locationId">
          {getFullLocationName(encounter?.location)}
        </LocalisedLabel>
      </Item>
    </RowContainer>
  );
};
