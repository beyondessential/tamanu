import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { getLocationName } from '../../patientAccessors';
import { Col } from '../Layout';

export const EncounterDetails = ({ encounter }) => {
  const { location, department } = encounter || {};

  return (
    <DataSection title="Encounter details">
      <Col>
        <DataItem label="Facility" value={location?.facility?.name} />
        <DataItem label="Location" value={getLocationName(encounter)} />
      </Col>
      <Col>
        <DataItem label="Department" value={department?.name} />
      </Col>
    </DataSection>
  );
};
