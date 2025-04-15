import React from 'react';
import styled from 'styled-components';

import { getCurrentDateString } from '@tamanu/utils/dateTime';

import { getFullLocationName } from '../../../../utils/location';
import { DateDisplay } from '../../../DateDisplay';

import { CertificateLabel, LocalisedCertificateLabel } from './CertificateLabels';
import { TranslatedText, TranslatedReferenceData } from '../../../Translation';
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
    <RowContainer data-testid="rowcontainer-q9yr">
      <Item data-testid="item-atdg">
        <Label name="Print date" data-testid="label-cg26">
          <DateDisplay date={getCurrentDateString()} data-testid="datedisplay-canb" />
        </Label>
      </Item>
      <Item data-testid="item-jyd5">
        <LocalisedLabel
          label={
            <TranslatedText
              stringId="general.localisedField.facility.label"
              fallback="Facility"
              data-testid="translatedtext-omgv"
            />
          }
          data-testid="localisedlabel-9rey"
        >
          {encounter?.location?.facility && (
            <TranslatedReferenceData
              fallback={encounter.location.facility.name}
              value={encounter.location.facility.id}
              category="facility"
              data-testid="translatedreferencedata-i7b9"
            />
          )}
        </LocalisedLabel>
      </Item>
      <Item data-testid="item-ora1">
        <LocalisedLabel
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
              data-testid="translatedtext-lxak"
            />
          }
          data-testid="localisedlabel-81r9"
        >
          {getFullLocationName(encounter?.location)}
        </LocalisedLabel>
      </Item>
    </RowContainer>
  );
};
