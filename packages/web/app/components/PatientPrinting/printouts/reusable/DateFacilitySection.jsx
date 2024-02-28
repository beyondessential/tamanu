import React from 'react';
import styled from 'styled-components';

import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';

import { getFullLocationName } from '../../../../utils/location';
import { DateDisplay } from '../../../DateDisplay';

import { CertificateLabel, LocalisedCertificateLabel } from './CertificateLabels';
import { TranslatedText } from '../../../Translation/TranslatedText';
import { TranslatedReferenceData } from '../../../Translation/TranslatedReferenceData';

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
        <LocalisedLabel
          label={
            <TranslatedText stringId="general.localisedField.facility.label" fallback="Facility" />
          }
        >
          {encounter?.location?.facility && <TranslatedReferenceData
            fallback={encounter.location.facility.name}
            value={encounter.location.facility.id}
            category="facility"
          />}
        </LocalisedLabel>
      </Item>
      <Item>
        <LocalisedLabel
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
            />
          }
        >
          {getFullLocationName(encounter?.location)}
        </LocalisedLabel>
      </Item>
    </RowContainer>
  );
};
