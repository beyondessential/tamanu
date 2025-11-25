import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { getLocationName } from '../../patientAccessors';
import { Col } from '../Layout';
import { HorizontalRule } from './HorizontalRule';

export const EncounterDetails = ({ encounter, hideLocation = false }) => {
  const { location, department } = encounter || {};

  return (
    <>
      <DataSection title="Encounter details" hideBottomRule>
        <Col>
          <DataItem label="Facility" value={location?.facility?.name} />
          {!hideLocation && <DataItem label="Location" value={getLocationName(encounter)} />}
        </Col>
        <Col>
          <DataItem label="Department" value={department?.name} />
        </Col>
      </DataSection>
      <HorizontalRule width="2px" />
    </>
  );
};
