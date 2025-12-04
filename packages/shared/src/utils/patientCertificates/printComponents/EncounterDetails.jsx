import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { getLocationName } from '../../patientAccessors';
import { Col } from '../Layout';
import { HorizontalRule } from './HorizontalRule';
import { useLanguageContext } from '../../pdf/languageContext';

export const EncounterDetails = ({ encounter, hideLocation = false }) => {
  const { getTranslation } = useLanguageContext();
  const { location, department } = encounter || {};

  return (
    <>
      <DataSection
        title={getTranslation('pdf.encounterDetails.title', 'Encounter details')}
        hideBottomRule
      >
        <Col>
          <DataItem
            label={getTranslation('general.localisedField.facility.label', 'Facility')}
            value={location?.facility?.name}
          />
          {!hideLocation && (
            <DataItem
              label={getTranslation('general.localisedField.locationId.label', 'Location')}
              value={getLocationName(encounter)}
            />
          )}
        </Col>
        <Col>
          <DataItem
            label={getTranslation('general.department.label', 'Department')}
            value={department?.name}
          />
        </Col>
      </DataSection>
      <HorizontalRule width="2px" />
    </>
  );
};
