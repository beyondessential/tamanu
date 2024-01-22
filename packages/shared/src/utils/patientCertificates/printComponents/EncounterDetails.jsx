import React from 'react';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { getLocationName } from '../../patientAccessors';
import { Col } from '../Layout';

export const EncounterDetails = ({ encounter, facility }) => {
  const { department } = encounter || {};

  return (
    <DataSection title="Encounter details">
      <Col>
        <DataItem label="Facility" value={facility?.name} />
        <DataItem label="Location" value={getLocationName(encounter)} />
      </Col>
      <Col>
        <DataItem label="Department" value={department?.name} />
      </Col>
    </DataSection>
  );
};
